/**
 * PURPOSE: Routes agent spawn requests to the correct spawn-streaming broker based on role
 *
 * USAGE:
 * const result = await agentSpawnByRoleBroker({
 *   workUnit: { role: 'codeweaver', step: DependencyStepStub() },
 *   timeoutMs: TimeoutMsStub({ value: 60000 }),
 * });
 * // Returns { sessionId, exitCode, signal, crashed, timedOut }
 *
 * NOTE: This is a stub implementation. The full implementation requires agent-spawn-streaming
 * infrastructure to be migrated from CLI.
 */

import type { SessionId } from '@dungeonmaster/shared/contracts';

import type { AgentSpawnStreamingResult } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import type { WorkUnit } from '../../../contracts/work-unit/work-unit-contract';

export const agentSpawnByRoleBroker = async ({
  workUnit,
  timeoutMs: _timeoutMs,
  resumeSessionId: _resumeSessionId,
}: {
  workUnit: WorkUnit;
  timeoutMs: TimeoutMs;
  resumeSessionId?: SessionId;
}): Promise<AgentSpawnStreamingResult> =>
  // Full implementation requires: agentSpawnStreamingBroker, agentStreamMonitorBroker, and role-specific prompts
  Promise.reject(
    new Error(
      `agentSpawnByRoleBroker not fully implemented: role "${workUnit.role}" spawn requires CLI infrastructure migration`,
    ),
  );
