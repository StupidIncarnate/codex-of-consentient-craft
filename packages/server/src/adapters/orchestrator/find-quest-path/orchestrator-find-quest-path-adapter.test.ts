import { AbsoluteFilePathStub, GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorFindQuestPathAdapter } from './orchestrator-find-quest-path-adapter';
import { orchestratorFindQuestPathAdapterProxy } from './orchestrator-find-quest-path-adapter.proxy';

describe('orchestratorFindQuestPathAdapter', () => {
  describe('successful find', () => {
    it('VALID: {questId} => returns quest path and guild id', async () => {
      const proxy = orchestratorFindQuestPathAdapterProxy();
      const questId = QuestIdStub({ value: 'test-quest' });
      const questPath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/guilds/guild-1/quests/001-test',
      });
      const guildId = GuildIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });

      proxy.returns({ questPath, guildId });

      const result = await orchestratorFindQuestPathAdapter({ questId });

      expect(result).toStrictEqual({ questPath, guildId });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorFindQuestPathAdapterProxy();
      const questId = QuestIdStub({ value: 'missing-quest' });

      proxy.throws({ error: new Error('Quest not found') });

      await expect(orchestratorFindQuestPathAdapter({ questId })).rejects.toThrow(
        /^Quest not found$/u,
      );
    });
  });
});
