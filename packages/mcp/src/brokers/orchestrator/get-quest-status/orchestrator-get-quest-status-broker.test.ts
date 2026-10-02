import { OrchestrationStatusStub } from '@dungeonmaster/shared/contracts/orchestration-status/orchestration-status.stub';

import { orchestratorGetQuestStatusBroker } from './orchestrator-get-quest-status-broker';
import { orchestratorGetQuestStatusBrokerProxy } from './orchestrator-get-quest-status-broker.proxy';

describe('orchestratorGetQuestStatusBroker', () => {
  describe('successful status retrieval', () => {
    it('VALID: {processId} => returns parsed orchestration status', async () => {
      const proxy = orchestratorGetQuestStatusBrokerProxy();
      const processId = 'proc-123';
      const status = OrchestrationStatusStub({
        processId: 'proc-123',
        questId: 'add-auth',
        phase: 'codeweaver',
      });

      proxy.returns({ processId, status });

      const result = await orchestratorGetQuestStatusBroker({ processId, startDir: '/repo' });

      expect(result).toStrictEqual(status);
    });
  });

  describe('error cases', () => {
    it('ERROR: {server returns "Process not found"} => throws "Process not found: <processId>"', async () => {
      const proxy = orchestratorGetQuestStatusBrokerProxy();
      const processId = 'proc-missing';

      proxy.setupServerError({ processId, message: 'Process not found: proc-missing' });

      await expect(
        orchestratorGetQuestStatusBroker({ processId, startDir: '/repo' }),
      ).rejects.toThrow(/Process not found: proc-missing/u);
    });

    it('ERROR: {fetch fails with generic error} => rethrows original message', async () => {
      const proxy = orchestratorGetQuestStatusBrokerProxy();
      const processId = 'proc-456';

      proxy.setupServerError({ processId, message: 'Internal server error' });

      await expect(
        orchestratorGetQuestStatusBroker({ processId, startDir: '/repo' }),
      ).rejects.toThrow(/Internal server error/u);
    });
  });
});
