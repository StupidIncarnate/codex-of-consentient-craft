import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorResumeQuestAdapter } from './orchestrator-resume-quest-adapter';
import { orchestratorResumeQuestAdapterProxy } from './orchestrator-resume-quest-adapter.proxy';

describe('orchestratorResumeQuestAdapter', () => {
  describe('successful resume', () => {
    it('VALID: {questId} => returns resumed result', async () => {
      const proxy = orchestratorResumeQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'test-quest' });

      proxy.returns({ resumed: true, restoredStatus: 'seek_scope' });

      const result = await orchestratorResumeQuestAdapter({ questId });

      expect(result).toStrictEqual({ resumed: true, restoredStatus: 'seek_scope' });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorResumeQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'test-quest' });

      proxy.throws({ error: new Error('Failed to resume quest') });

      await expect(orchestratorResumeQuestAdapter({ questId })).rejects.toThrow(
        /Failed to resume quest/u,
      );
    });
  });
});
