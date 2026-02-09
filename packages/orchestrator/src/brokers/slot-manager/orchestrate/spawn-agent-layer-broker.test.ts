import { DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { CodeweaverWorkUnitStub } from '../../../contracts/work-unit/work-unit.stub';
import { spawnAgentLayerBroker } from './spawn-agent-layer-broker';
import { spawnAgentLayerBrokerProxy } from './spawn-agent-layer-broker.proxy';

describe('spawnAgentLayerBroker', () => {
  describe('stub implementation', () => {
    it('ERROR: {workUnit, timeoutMs} => throws not implemented error from underlying broker', async () => {
      spawnAgentLayerBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const timeoutMs = TimeoutMsStub({ value: 60000 });

      await expect(
        spawnAgentLayerBroker({
          workUnit,
          timeoutMs,
        }),
      ).rejects.toThrow(/agentSpawnByRoleBroker not fully implemented/u);
    });
  });
});
