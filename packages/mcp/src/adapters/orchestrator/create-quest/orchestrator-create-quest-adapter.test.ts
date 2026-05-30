import { QuestIdStub, SessionIdStub, UrlSlugStub } from '@dungeonmaster/shared/contracts';

import { CreateQuestInputStub } from '../../../contracts/create-quest-input/create-quest-input.stub';
import { orchestratorCreateQuestAdapter } from './orchestrator-create-quest-adapter';
import { orchestratorCreateQuestAdapterProxy } from './orchestrator-create-quest-adapter.proxy';

describe('orchestratorCreateQuestAdapter', () => {
  describe('successful create', () => {
    it('VALID: {userRequest} => returns { questId, guildSlug }', async () => {
      const proxy = orchestratorCreateQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'cccccccc-3333-4444-9555-666666666666' });
      const guildSlug = UrlSlugStub({ value: 'my-guild' });
      const { userRequest } = CreateQuestInputStub();

      proxy.returns({ questId, guildSlug });

      const result = await orchestratorCreateQuestAdapter({ userRequest });

      expect(result).toStrictEqual({ questId, guildSlug });
    });

    it('VALID: {userRequest, sessionId} => forwards sessionId to orchestrator', async () => {
      const proxy = orchestratorCreateQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'cccccccc-3333-4444-9555-666666666666' });
      const guildSlug = UrlSlugStub({ value: 'my-guild' });
      const sessionId = SessionIdStub({ value: 'dddddddd-4444-4555-9666-777777777777' });
      const { userRequest } = CreateQuestInputStub();

      proxy.returns({ questId, guildSlug });

      const result = await orchestratorCreateQuestAdapter({ userRequest, sessionId });

      expect(result).toStrictEqual({ questId, guildSlug });
    });

    it('VALID: {userRequest, questType: "bug-hunt"} => forwards questType to orchestrator', async () => {
      const proxy = orchestratorCreateQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'cccccccc-3333-4444-9555-666666666666' });
      const guildSlug = UrlSlugStub({ value: 'my-guild' });
      const { userRequest } = CreateQuestInputStub();

      proxy.returns({ questId, guildSlug });

      const result = await orchestratorCreateQuestAdapter({ userRequest, questType: 'bug-hunt' });

      expect(result).toStrictEqual({ questId, guildSlug });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorCreateQuestAdapterProxy();
      const { userRequest } = CreateQuestInputStub();

      proxy.throws({ error: new Error('No valid guild') });

      await expect(orchestratorCreateQuestAdapter({ userRequest })).rejects.toThrow(
        /No valid guild/u,
      );
    });
  });
});
