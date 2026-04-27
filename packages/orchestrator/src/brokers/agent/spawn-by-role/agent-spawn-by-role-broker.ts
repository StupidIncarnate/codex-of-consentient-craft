/**
 * PURPOSE: Routes agent spawn requests to the correct spawn-streaming broker based on role
 *
 * USAGE:
 * const result = await agentSpawnByRoleBroker({
 *   workUnit: { role: 'codeweaver', step: DependencyStepStub() },
 * });
 * // Returns { sessionId, exitCode, signal, crashed }
 */

import {
  absoluteFilePathContract,
  exitCodeContract,
  filePathContract,
  repoRootCwdContract,
  type AbsoluteFilePath,
  type FilePath,
  type RepoRootCwd,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBroker, cwdResolveBroker } from '@dungeonmaster/shared/brokers';

import {
  agentSpawnStreamingResultContract,
  type AgentSpawnStreamingResult,
} from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import {
  claudeModelContract,
  type ClaudeModel,
} from '../../../contracts/claude-model/claude-model-contract';
import type { ContinuationContext } from '../../../contracts/continuation-context/continuation-context-contract';
import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import type { StreamSignal } from '../../../contracts/stream-signal/stream-signal-contract';
import type { StreamText } from '../../../contracts/stream-text/stream-text-contract';
import type { WorkUnit } from '../../../contracts/work-unit/work-unit-contract';
import { roleToModelTransformer } from '../../../transformers/role-to-model/role-to-model-transformer';
import { roleToPromptTemplateTransformer } from '../../../transformers/role-to-prompt-template/role-to-prompt-template-transformer';
import { signalFromStreamTransformer } from '../../../transformers/signal-from-stream/signal-from-stream-transformer';
import { streamJsonToTextTransformer } from '../../../transformers/stream-json-to-text/stream-json-to-text-transformer';
import { workUnitToArgumentsTransformer } from '../../../transformers/work-unit-to-arguments/work-unit-to-arguments-transformer';
import { agentSpawnUnifiedBroker } from '../spawn-unified/agent-spawn-unified-broker';
import { signalFromSessionJsonlBroker } from '../../signal/from-session-jsonl/signal-from-session-jsonl-broker';

const SMOKETEST_MODEL = claudeModelContract.parse('haiku');

export const agentSpawnByRoleBroker = async ({
  workUnit,
  startPath,
  resumeSessionId,
  continuationContext,
  onLine,
  onSessionId,
  abortSignal,
}: {
  workUnit: WorkUnit;
  startPath: FilePath;
  resumeSessionId?: SessionId;
  continuationContext?: ContinuationContext;
  onLine?: (params: { line: string }) => void;
  onSessionId?: (params: { sessionId: SessionId }) => void;
  abortSignal?: AbortSignal;
}): Promise<AgentSpawnStreamingResult> => {
  const overrideText = workUnit.smoketestPromptOverride;
  const baseText =
    overrideText === undefined
      ? roleToPromptTemplateTransformer({ role: workUnit.role }).replace(
          '$ARGUMENTS',
          workUnitToArgumentsTransformer({ workUnit }),
        )
      : overrideText;

  const shouldAppendContinuation = overrideText === undefined && continuationContext !== undefined;
  const promptText = shouldAppendContinuation
    ? `${baseText}\n\n## Continuation Context\n${continuationContext}`
    : baseText;

  const prompt = promptTextContract.parse(promptText);

  const isSmoketestSpawn = overrideText !== undefined;

  // Smoketest spawns force haiku for cost/speed. Real roles resolve via the role→model map.
  const model: ClaudeModel = isSmoketestSpawn
    ? SMOKETEST_MODEL
    : roleToModelTransformer({ role: workUnit.role });

  // Walk up from `startPath` to the directory containing `.dungeonmaster.json` so the
  // spawned agent's cwd lets `.mcp.json` resolve its relative `node packages/mcp/dist/src/index.js`
  // command. `cwdResolveBroker({ kind: 'repo-root' })` is idempotent — when `startPath` itself
  // contains `.dungeonmaster.json` (e.g. the codex guild's repo-root path) it returns `startPath`
  // unchanged. For the smoketests guild, whose path is the dungeonmaster home (`.dungeonmaster-dev/`),
  // it walks up to the repo root. This also correctly handles auto-spawned recovery agents
  // (pathseeker for replan) on smoketest quests, which don't carry `smoketestPromptOverride`.
  // Fallback to `startPath` when no `.dungeonmaster.json` ancestor exists — guild paths in
  // standalone projects (and e2e isolated /tmp dirs) won't have one, and the spawn should still
  // run from the guild path. Only smoketest spawns truly need the repo-root walk.
  const parsedStartPath = filePathContract.parse(startPath);
  const resolvedCwd: RepoRootCwd = await (async (): Promise<RepoRootCwd> => {
    try {
      return await cwdResolveBroker({ startPath: parsedStartPath, kind: 'repo-root' });
    } catch {
      return repoRootCwdContract.parse(startPath);
    }
  })();

  try {
    let lastSignal: StreamSignal | null = null;
    const outputLines: StreamText[] = [];

    const streamingResult = await new Promise<AgentSpawnStreamingResult>((resolve) => {
      const { kill, sessionId$ } = agentSpawnUnifiedBroker({
        prompt,
        cwd: resolvedCwd,
        ...(resumeSessionId === undefined ? {} : { resumeSessionId }),
        model,
        disableToolSearch: isSmoketestSpawn,
        onLine: ({ line }) => {
          onLine?.({ line });

          const parsed = claudeLineNormalizeBroker({ rawLine: line });

          const text = streamJsonToTextTransformer({ parsed });
          if (text !== null) {
            outputLines.push(text);
          }

          const signal = signalFromStreamTransformer({ parsed });
          if (signal !== null) {
            lastSignal = signal;
          }
        },
        onComplete: ({ exitCode, sessionId }) => {
          const parsedExitCode = exitCode === null ? null : exitCodeContract.parse(exitCode);
          const crashed = parsedExitCode !== null && parsedExitCode !== 0;

          resolve(
            agentSpawnStreamingResultContract.parse({
              sessionId,
              exitCode: parsedExitCode,
              signal: lastSignal,
              crashed,
              capturedOutput: outputLines,
            }),
          );
        },
      });

      if (onSessionId !== undefined) {
        sessionId$
          .then((sid) => {
            if (sid !== null) {
              onSessionId({ sessionId: sid });
            }
          })
          .catch((error: unknown) => {
            process.stderr.write(`[agent-spawn] session-id resolution failed: ${String(error)}\n`);
          });
      }

      if (abortSignal && !abortSignal.aborted) {
        abortSignal.addEventListener('abort', kill, { once: true });
      } else if (abortSignal?.aborted) {
        kill();
      }
    });

    // Disk fallback: when the live stream parser missed the agent's signal-back call but a
    // session JSONL exists on disk, walk the file for the last signal-back tool_use line.
    // The live and disk paths emit the same envelope shape; differences in stream-event
    // framing across Claude CLI versions make the live parser miss signals that are still
    // reliably written to `~/.claude/projects/<encoded-cwd>/<sessionId>.jsonl`.
    if (streamingResult.signal === null && streamingResult.sessionId !== null) {
      const guildPath: AbsoluteFilePath = absoluteFilePathContract.parse(resolvedCwd);
      const fromDisk = await signalFromSessionJsonlBroker({
        guildPath,
        sessionId: streamingResult.sessionId,
      });
      if (fromDisk !== null) {
        return agentSpawnStreamingResultContract.parse({
          ...streamingResult,
          signal: fromDisk,
        });
      }
    }

    return streamingResult;
  } catch {
    return agentSpawnStreamingResultContract.parse({
      crashed: true,
      signal: null,
      sessionId: null,
      exitCode: null,
    });
  }
};
