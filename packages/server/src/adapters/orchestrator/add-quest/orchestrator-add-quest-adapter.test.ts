import { AddQuestResultStub, GuildIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorAddQuestAdapter } from './orchestrator-add-quest-adapter';
import { orchestratorAddQuestAdapterProxy } from './orchestrator-add-quest-adapter.proxy';

describe('orchestratorAddQuestAdapter', () => {
  describe('successful add', () => {
    it('VALID: {title, userRequest, guildId} => returns add quest result', async () => {
      const proxy = orchestratorAddQuestAdapterProxy();
      const guildId = GuildIdStub();
      const result = AddQuestResultStub();

      proxy.returns({ guildId, result });

      const addResult = await orchestratorAddQuestAdapter({
        title: 'Add Auth',
        userRequest: 'User wants authentication',
        guildId,
      });

      expect(addResult).toStrictEqual(result);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorAddQuestAdapterProxy();
      const guildId = GuildIdStub();

      proxy.throws({ guildId, error: new Error('Failed to add quest') });

      await expect(
        orchestratorAddQuestAdapter({
          title: 'Add Auth',
          userRequest: 'User wants authentication',
          guildId,
        }),
      ).rejects.toThrow(/Failed to add quest/u);
    });
  });
});
