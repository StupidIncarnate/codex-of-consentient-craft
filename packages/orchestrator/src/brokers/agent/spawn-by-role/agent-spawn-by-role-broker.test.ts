import { DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { CodeweaverWorkUnitStub } from '../../../contracts/work-unit/work-unit.stub';
import { agentSpawnByRoleBroker } from './agent-spawn-by-role-broker';
import { agentSpawnByRoleBrokerProxy } from './agent-spawn-by-role-broker.proxy';

describe('agentSpawnByRoleBroker', () => {
  describe('stub implementation', () => {
    it('ERROR: {any role} => throws not implemented error', async () => {
      agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const timeoutMs = TimeoutMsStub({ value: 60000 });

      await expect(
        agentSpawnByRoleBroker({
          workUnit,
          timeoutMs,
        }),
      ).rejects.toThrow(/agentSpawnByRoleBroker not fully implemented/u);
    });
  });
});
