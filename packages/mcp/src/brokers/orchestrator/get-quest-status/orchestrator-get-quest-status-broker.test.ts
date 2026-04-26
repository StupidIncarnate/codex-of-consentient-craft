import { OrchestrationStatusStub, ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorGetQuestStatusBroker } from './orchestrator-get-quest-status-broker';
import { orchestratorGetQuestStatusBrokerProxy } from './orchestrator-get-quest-status-broker.proxy';

describe('orchestratorGetQuestStatusBroker', () => {
  describe('successful status retrieval', () => {
    it('VALID: {processId} => returns parsed orchestration status', async () => {
      const proxy = orchestratorGetQuestStatusBrokerProxy();
      const processId = ProcessIdStub({ value: 'proc-123' });
      const status = OrchestrationStatusStub({
        processId: 'proc-123',
        questId: 'add-auth',
        phase: 'codeweaver',
      });

      proxy.returns({ status });

      const result = await orchestratorGetQuestStatusBroker({ processId });

      expect(result).toStrictEqual(status);
    });
  });

  describe('error cases', () => {
    it('ERROR: {server returns "Process not found"} => throws "Process not found: <processId>"', async () => {
      const proxy = orchestratorGetQuestStatusBrokerProxy();
      const processId = ProcessIdStub({ value: 'proc-missing' });

      proxy.throws({ error: new Error('Process not found: proc-missing') });

      await expect(orchestratorGetQuestStatusBroker({ processId })).rejects.toThrow(
        /Process not found: proc-missing/u,
      );
    });

    it('ERROR: {fetch fails with generic error} => rethrows original message', async () => {
      const proxy = orchestratorGetQuestStatusBrokerProxy();
      const processId = ProcessIdStub({ value: 'proc-456' });

      proxy.throws({ error: new Error('Internal server error') });

      await expect(orchestratorGetQuestStatusBroker({ processId })).rejects.toThrow(
        /Internal server error/u,
      );
    });
  });
});
