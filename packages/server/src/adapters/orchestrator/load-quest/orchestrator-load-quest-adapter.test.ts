import { QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { orchestratorLoadQuestAdapter } from './orchestrator-load-quest-adapter';
import { orchestratorLoadQuestAdapterProxy } from './orchestrator-load-quest-adapter.proxy';

describe('orchestratorLoadQuestAdapter', () => {
  describe('successful load', () => {
    it('VALID: {questId} => returns quest', async () => {
      orchestratorLoadQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'test-quest' });

      const result = await orchestratorLoadQuestAdapter({ questId });

      expect(result).toStrictEqual(QuestStub());
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorLoadQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'missing-quest' });

      proxy.throws({ error: new Error('Quest not found') });

      await expect(orchestratorLoadQuestAdapter({ questId })).rejects.toThrow(/^Quest not found$/u);
    });
  });
});
