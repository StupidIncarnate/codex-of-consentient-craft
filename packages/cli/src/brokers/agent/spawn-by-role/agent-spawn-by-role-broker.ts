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

import { codeweaverSpawnStreamingBroker } from '../../codeweaver/spawn-streaming/codeweaver-spawn-streaming-broker';
import { lawbringerSpawnStreamingBroker } from '../../lawbringer/spawn-streaming/lawbringer-spawn-streaming-broker';
import { pathseekerSpawnStreamingBroker } from '../../pathseeker/spawn-streaming/pathseeker-spawn-streaming-broker';
import { siegemasterSpawnStreamingBroker } from '../../siegemaster/spawn-streaming/siegemaster-spawn-streaming-broker';
import { spiritmenderSpawnStreamingBroker } from '../../spiritmender/spawn-streaming/spiritmender-spawn-streaming-broker';
import type { AgentSpawnStreamingResult } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import type { WorkUnit } from '../../../contracts/work-unit/work-unit-contract';

export const agentSpawnByRoleBroker = async ({
  workUnit,
  timeoutMs,
  resumeSessionId,
}: {
  workUnit: WorkUnit;
  timeoutMs: TimeoutMs;
  resumeSessionId?: SessionId;
}): Promise<AgentSpawnStreamingResult> => {
  switch (workUnit.role) {
    case 'pathseeker': {
      const spawnArgs = resumeSessionId
        ? { questId: workUnit.questId, resumeSessionId, timeoutMs }
        : { questId: workUnit.questId, timeoutMs };
      return pathseekerSpawnStreamingBroker(spawnArgs);
    }

    case 'codeweaver': {
      const spawnArgs = resumeSessionId
        ? { step: workUnit.step, resumeSessionId, timeoutMs }
        : { step: workUnit.step, timeoutMs };
      return codeweaverSpawnStreamingBroker(spawnArgs);
    }

    case 'spiritmender': {
      const spawnArgs = resumeSessionId
        ? { workUnit: workUnit.file, stepId: workUnit.stepId, resumeSessionId, timeoutMs }
        : { workUnit: workUnit.file, stepId: workUnit.stepId, timeoutMs };
      return spiritmenderSpawnStreamingBroker(spawnArgs);
    }

    case 'lawbringer': {
      const spawnArgs = resumeSessionId
        ? { workUnit: workUnit.filePair, stepId: workUnit.stepId, resumeSessionId, timeoutMs }
        : { workUnit: workUnit.filePair, stepId: workUnit.stepId, timeoutMs };
      return lawbringerSpawnStreamingBroker(spawnArgs);
    }

    case 'siegemaster': {
      const spawnArgs = resumeSessionId
        ? { questId: workUnit.questId, stepId: workUnit.stepId, resumeSessionId, timeoutMs }
        : { questId: workUnit.questId, stepId: workUnit.stepId, timeoutMs };
      return siegemasterSpawnStreamingBroker(spawnArgs);
    }

    default: {
      // TypeScript exhaustiveness check - this should never be reached
      const exhaustiveCheck: never = workUnit;
      throw new Error(`Unknown role: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
};
