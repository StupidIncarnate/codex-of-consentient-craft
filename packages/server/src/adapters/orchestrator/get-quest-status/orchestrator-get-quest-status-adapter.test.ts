import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorGetQuestStatusAdapter } from './orchestrator-get-quest-status-adapter';
import { orchestratorGetQuestStatusAdapterProxy } from './orchestrator-get-quest-status-adapter.proxy';

describe('orchestratorGetQuestStatusAdapter', () => {
  describe('successful get status', () => {
    it('VALID: {processId} => returns orchestration status', () => {
      orchestratorGetQuestStatusAdapterProxy();
      const processId = ProcessIdStub();

      const result = orchestratorGetQuestStatusAdapter({ processId });

      expect(result.processId).toBe('proc-12345');
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', () => {
      const proxy = orchestratorGetQuestStatusAdapterProxy();
      const processId = ProcessIdStub();

      proxy.throws({ error: new Error('Process not found') });

      expect(() => orchestratorGetQuestStatusAdapter({ processId })).toThrow(/Process not found/u);
    });
  });
});
