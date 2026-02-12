/**
 * PURPOSE: Routes agent spawn requests to the correct spawn-streaming broker based on role
 *
 * USAGE:
 * const result = await agentSpawnByRoleBroker({
 *   workUnit: { role: 'codeweaver', step: DependencyStepStub() },
 *   timeoutMs: TimeoutMsStub({ value: 60000 }),
 * });
 * // Returns { sessionId, exitCode, signal, crashed, timedOut }
 */

import type { SessionId } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnStreamJsonAdapter } from '../../../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter';
import {
  agentSpawnStreamingResultContract,
  type AgentSpawnStreamingResult,
} from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import type { ContinuationContext } from '../../../contracts/continuation-context/continuation-context-contract';
import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import type { WorkUnit } from '../../../contracts/work-unit/work-unit-contract';
import { roleToPromptTemplateTransformer } from '../../../transformers/role-to-prompt-template/role-to-prompt-template-transformer';
import { workUnitToArgumentsTransformer } from '../../../transformers/work-unit-to-arguments/work-unit-to-arguments-transformer';
import { agentStreamMonitorBroker } from '../stream-monitor/agent-stream-monitor-broker';

export const agentSpawnByRoleBroker = async ({
  workUnit,
  timeoutMs,
  resumeSessionId,
  continuationContext,
  onLine,
}: {
  workUnit: WorkUnit;
  timeoutMs: TimeoutMs;
  resumeSessionId?: SessionId;
  continuationContext?: ContinuationContext;
  onLine?: (params: { line: string }) => void;
}): Promise<AgentSpawnStreamingResult> => {
  const template = roleToPromptTemplateTransformer({ role: workUnit.role });
  const args = workUnitToArgumentsTransformer({ workUnit });
  let promptText = template.replace('$ARGUMENTS', args);

  if (continuationContext !== undefined) {
    promptText += `\n\n## Continuation Context\n${continuationContext}`;
  }

  const prompt = promptTextContract.parse(promptText);

  try {
    const { process: childProcess, stdout } = childProcessSpawnStreamJsonAdapter({
      prompt,
      ...(resumeSessionId === undefined ? {} : { resumeSessionId }),
    });

    return await agentStreamMonitorBroker({
      stdout,
      process: childProcess,
      timeoutMs,
      ...(onLine === undefined ? {} : { onLine }),
    });
  } catch {
    return agentSpawnStreamingResultContract.parse({
      crashed: true,
      timedOut: false,
      signal: null,
      sessionId: null,
      exitCode: null,
    });
  }
};
