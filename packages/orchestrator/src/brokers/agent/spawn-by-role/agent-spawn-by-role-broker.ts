/**
 * PURPOSE: Routes orchestration-loop agent spawn requests through the unified `agentLaunchBroker`. Builds the prompt from the work unit's role, resolves cwd, and delegates the full spawn lifecycle (handle, post-exit main-tail, sub-agent tails) to the launcher. Captures `onText` into `outputLines[]` and the latest `onSignal` into `lastSignal` so the loop layer brokers receive a tidy `AgentSpawnStreamingResult`. Falls back to disk-walking the session JSONL for a missed signal-back when the live stream parser misses one.
 *
 * USAGE:
 * const result = await agentSpawnByRoleBroker({
 *   workUnit: { role: 'codeweaver', step: DependencyStepStub() },
 *   startPath,
 *   guildId,
 *   questId,
 *   questWorkItemId,
 * });
 * // Returns { sessionId, exitCode, signal, crashed, capturedOutput }
 */

import {
  absoluteFilePathContract,
  exitCodeContract,
  filePathContract,
  repoRootCwdContract,
  type AbsoluteFilePath,
  type ChatEntry,
  type FilePath,
  type GuildId,
  type RepoRootCwd,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';

import {
  agentSpawnStreamingResultContract,
  type AgentSpawnStreamingResult,
} from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import {
  claudeModelContract,
  type ClaudeModel,
} from '../../../contracts/claude-model/claude-model-contract';
import type { ContinuationContext } from '../../../contracts/continuation-context/continuation-context-contract';
import { processIdPrefixContract } from '../../../contracts/process-id-prefix/process-id-prefix-contract';
import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import type { StreamSignal } from '../../../contracts/stream-signal/stream-signal-contract';
import type { StreamText } from '../../../contracts/stream-text/stream-text-contract';
import type { WorkUnit } from '../../../contracts/work-unit/work-unit-contract';
import { roleToModelTransformer } from '../../../transformers/role-to-model/role-to-model-transformer';
import { roleToPromptTemplateTransformer } from '../../../transformers/role-to-prompt-template/role-to-prompt-template-transformer';
import { workUnitToArgumentsTransformer } from '../../../transformers/work-unit-to-arguments/work-unit-to-arguments-transformer';
import { agentLaunchBroker } from '../launch/agent-launch-broker';
import { signalFromSessionJsonlBroker } from '../../signal/from-session-jsonl/signal-from-session-jsonl-broker';

const SMOKETEST_MODEL = claudeModelContract.parse('haiku');
const PROC_PREFIX = processIdPrefixContract.parse('proc');

export const agentSpawnByRoleBroker = async ({
  workUnit,
  startPath,
  guildId,
  resumeSessionId,
  continuationContext,
  onEntries,
  onSessionId,
  abortSignal,
}: {
  workUnit: WorkUnit;
  startPath: FilePath;
  guildId: GuildId;
  resumeSessionId?: SessionId;
  continuationContext?: ContinuationContext;
  onEntries?: (params: { entries: ChatEntry[]; sessionId: SessionId | undefined }) => void;
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

  const model: ClaudeModel = isSmoketestSpawn
    ? SMOKETEST_MODEL
    : roleToModelTransformer({ role: workUnit.role });

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
      agentLaunchBroker({
        guildId,
        processIdPrefix: PROC_PREFIX,
        prompt,
        cwd: resolvedCwd,
        model,
        ...(resumeSessionId === undefined ? {} : { resumeSessionId }),
        ...(isSmoketestSpawn ? { disableToolSearch: true } : {}),
        onEntries: ({ entries, sessionId }) => {
          onEntries?.({ entries, sessionId });
        },
        onText: ({ text }) => {
          outputLines.push(text);
        },
        onSignal: ({ signal }) => {
          lastSignal = signal;
        },
        onSessionId: ({ sessionId }) => {
          if (onSessionId !== undefined) {
            try {
              onSessionId({ sessionId });
            } catch (error: unknown) {
              process.stderr.write(
                `[agent-spawn] session-id resolution failed: ${String(error)}\n`,
              );
            }
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
        ...(abortSignal === undefined ? {} : { abortSignal }),
      });
    });

    // Disk fallback: when the live stream parser missed the agent's signal-back call but a
    // session JSONL exists on disk, walk the file for the last signal-back tool_use line.
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
