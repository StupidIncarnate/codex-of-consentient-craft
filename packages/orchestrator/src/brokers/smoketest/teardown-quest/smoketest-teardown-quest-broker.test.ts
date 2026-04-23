import { AbsoluteFilePathStub, GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { smoketestTeardownQuestBroker } from './smoketest-teardown-quest-broker';
import { smoketestTeardownQuestBrokerProxy } from './smoketest-teardown-quest-broker.proxy';

const QUEST_ID = QuestIdStub({ value: 'teardown-quest' });
const QUEST_PATH = AbsoluteFilePathStub({
  value:
    '/home/testuser/.dungeonmaster/guilds/11111111-1111-1111-1111-111111111111/quests/teardown-quest',
});
const GUILD_ID = GuildIdStub({ value: '11111111-1111-1111-1111-111111111111' });

describe('smoketestTeardownQuestBroker', () => {
  describe('successful removal', () => {
    it('VALID: {quest found} => removes quest folder recursively and resolves success', async () => {
      const proxy = smoketestTeardownQuestBrokerProxy();
      proxy.setupQuestFound({ questPath: QUEST_PATH, guildId: GUILD_ID, questId: QUEST_ID });

      const result = await smoketestTeardownQuestBroker({ questId: QUEST_ID });

      const calls = proxy.getRmCallArgs();
      const lastCall = calls[calls.length - 1];

      expect({
        result,
        callCount: calls.length,
        pathArg: lastCall?.[0],
        optionsArg: lastCall?.[1],
      }).toStrictEqual({
        result: { success: true },
        callCount: 1,
        pathArg: QUEST_PATH,
        optionsArg: { recursive: true, force: true },
      });
    });
  });

  describe('idempotent when quest is gone', () => {
    it('VALID: {quest not found} => returns success without calling rm', async () => {
      const proxy = smoketestTeardownQuestBrokerProxy();
      proxy.setupQuestNotFound();

      const result = await smoketestTeardownQuestBroker({ questId: QUEST_ID });

      expect({
        result,
        callCount: proxy.getRmCallArgs().length,
      }).toStrictEqual({
        result: { success: true },
        callCount: 0,
      });
    });

    it('VALID: {quest found but rm throws ENOENT} => swallows error and returns success', async () => {
      const proxy = smoketestTeardownQuestBrokerProxy();
      proxy.setupQuestFound({ questPath: QUEST_PATH, guildId: GUILD_ID, questId: QUEST_ID });
      proxy.setupRmFailure({ error: new Error('ENOENT: no such file or directory') });

      const result = await smoketestTeardownQuestBroker({ questId: QUEST_ID });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
