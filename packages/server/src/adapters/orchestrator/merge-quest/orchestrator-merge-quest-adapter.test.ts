import { QuestIdStub } from '@dungeonmaster/shared/contracts';
import { orchestratorMergeQuestAdapter } from './orchestrator-merge-quest-adapter';
import { orchestratorMergeQuestAdapterProxy } from './orchestrator-merge-quest-adapter.proxy';

describe('orchestratorMergeQuestAdapter', () => {
  describe('successful call', () => {
    it('VALID: {questId} => returns merging true', async () => {
      const proxy = orchestratorMergeQuestAdapterProxy();
      const questId = QuestIdStub();
      proxy.returns({ questId, merging: true });

      const result = await orchestratorMergeQuestAdapter({ questId });

      expect(result).toStrictEqual({ merging: true });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorMergeQuestAdapterProxy();
      const questId = QuestIdStub();
      proxy.throws({ questId, error: new Error('Merge failed') });

      await expect(orchestratorMergeQuestAdapter({ questId })).rejects.toThrow(/Merge failed/u);
    });
  });
});
