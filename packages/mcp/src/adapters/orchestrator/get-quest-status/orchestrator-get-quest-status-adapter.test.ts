import { OrchestrationStatusStub, ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorGetQuestStatusAdapter } from './orchestrator-get-quest-status-adapter';
import { orchestratorGetQuestStatusAdapterProxy } from './orchestrator-get-quest-status-adapter.proxy';

describe('orchestratorGetQuestStatusAdapter', () => {
  describe('successful status retrieval', () => {
    it('VALID: {processId} => returns orchestration status', async () => {
      const proxy = orchestratorGetQuestStatusAdapterProxy();
      const processId = ProcessIdStub({ value: 'proc-123' });
      const status = OrchestrationStatusStub({
        processId: 'proc-123',
        questId: 'add-auth',
        phase: 'codeweaver',
      });

      proxy.returns({ status });

      const result = await orchestratorGetQuestStatusAdapter({ processId });

      expect(result).toStrictEqual(status);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorGetQuestStatusAdapterProxy();
      const processId = ProcessIdStub({ value: 'proc-123' });

      proxy.throws({ error: new Error('Not implemented') });

      await expect(orchestratorGetQuestStatusAdapter({ processId })).rejects.toThrow(
        /Not implemented/u,
      );
    });
  });
});
