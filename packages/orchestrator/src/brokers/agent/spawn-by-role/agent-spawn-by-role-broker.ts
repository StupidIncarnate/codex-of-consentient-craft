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
  type FilePath,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';

import {
  agentSpawnStreamingResultContract,
  type AgentSpawnStreamingResult,
} from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import type { ContinuationContext } from '../../../contracts/continuation-context/continuation-context-contract';
import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import type { StreamSignal } from '../../../contracts/stream-signal/stream-signal-contract';
import type { StreamText } from '../../../contracts/stream-text/stream-text-contract';
import type { WorkUnit } from '../../../contracts/work-unit/work-unit-contract';
import { roleToPromptTemplateTransformer } from '../../../transformers/role-to-prompt-template/role-to-prompt-template-transformer';
import { signalFromStreamTransformer } from '../../../transformers/signal-from-stream/signal-from-stream-transformer';
import { streamJsonToTextTransformer } from '../../../transformers/stream-json-to-text/stream-json-to-text-transformer';
import { workUnitToArgumentsTransformer } from '../../../transformers/work-unit-to-arguments/work-unit-to-arguments-transformer';
import { agentSpawnUnifiedBroker } from '../spawn-unified/agent-spawn-unified-broker';

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
  const template = roleToPromptTemplateTransformer({ role: workUnit.role });
  const args = workUnitToArgumentsTransformer({ workUnit });
  let promptText = template.replace('$ARGUMENTS', args);

  if (continuationContext !== undefined) {
    promptText += `\n\n## Continuation Context\n${continuationContext}`;
  }

  const prompt = promptTextContract.parse(promptText);

  try {
    let lastSignal: StreamSignal | null = null;
    const outputLines: StreamText[] = [];

    return await new Promise<AgentSpawnStreamingResult>((resolve) => {
      const { kill, sessionId$ } = agentSpawnUnifiedBroker({
        prompt,
        cwd: absoluteFilePathContract.parse(startPath),
        ...(resumeSessionId === undefined ? {} : { resumeSessionId }),
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
  } catch {
    return agentSpawnStreamingResultContract.parse({
      crashed: true,
      signal: null,
      sessionId: null,
      exitCode: null,
    });
  }
};
