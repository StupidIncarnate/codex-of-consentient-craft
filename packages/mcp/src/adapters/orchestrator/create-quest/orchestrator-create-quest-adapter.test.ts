import { QuestIdStub, UrlSlugStub } from '@dungeonmaster/shared/contracts';

import { orchestratorCreateQuestAdapter } from './orchestrator-create-quest-adapter';
import { orchestratorCreateQuestAdapterProxy } from './orchestrator-create-quest-adapter.proxy';

describe('orchestratorCreateQuestAdapter', () => {
  describe('successful create', () => {
    it('VALID: {} => returns { questId, guildSlug }', async () => {
      const proxy = orchestratorCreateQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'cccccccc-3333-4444-9555-666666666666' });
      const guildSlug = UrlSlugStub({ value: 'my-guild' });

      proxy.returns({ questId, guildSlug });

      const result = await orchestratorCreateQuestAdapter();

      expect(result).toStrictEqual({ questId, guildSlug });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorCreateQuestAdapterProxy();

      proxy.throws({ error: new Error('No valid guild') });

      await expect(orchestratorCreateQuestAdapter()).rejects.toThrow(/No valid guild/u);
    });
  });
});
