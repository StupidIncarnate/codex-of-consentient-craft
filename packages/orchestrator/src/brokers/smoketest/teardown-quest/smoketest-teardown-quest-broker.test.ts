import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';

import { smoketestTeardownQuestBroker } from './smoketest-teardown-quest-broker';
import { smoketestTeardownQuestBrokerProxy } from './smoketest-teardown-quest-broker.proxy';

const QUEST_ID = QuestIdStub({ value: 'teardown-quest' });
const QUEST_PATH = AbsoluteFilePathStub({
  value:
    '/home/testuser/.dungeonmaster/guilds/38c6cbd2-8bf1-6507-8d07-0980dd1fb595/quests/teardown-quest',
});
const GUILD_ID = GuildIdStub({ value: '38c6cbd2-8bf1-6507-8d07-0980dd1fb595' });

describe('smoketestTeardownQuestBroker', () => {
  describe('successful removal', () => {
    it('VALID: {quest found} => removes quest folder recursively and resolves success', async () => {
      const proxy = smoketestTeardownQuestBrokerProxy();
      proxy.setupQuestFound({ questPath: QUEST_PATH, guildId: GUILD_ID, questId: QUEST_ID });

      await expect(smoketestTeardownQuestBroker({ questId: QUEST_ID })).resolves.toBe(undefined);

      const calls = proxy.getRmCallArgs();
      const lastCall = calls[calls.length - 1];

      expect({
        callCount: calls.length,
        pathArg: lastCall?.[0],
        optionsArg: lastCall?.[1],
      }).toStrictEqual({
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

      await expect(smoketestTeardownQuestBroker({ questId: QUEST_ID })).resolves.toBe(undefined);

      expect({
        callCount: proxy.getRmCallArgs().length,
      }).toStrictEqual({
        callCount: 0,
      });
    });

    it('VALID: {quest found but rm throws ENOENT} => swallows error and returns success', async () => {
      const proxy = smoketestTeardownQuestBrokerProxy();
      proxy.setupQuestFound({ questPath: QUEST_PATH, guildId: GUILD_ID, questId: QUEST_ID });
      proxy.setupRmFailure({
        error: FsErrorStub({ code: 'ENOENT', path: QUEST_PATH, syscall: 'rm' }),
      });

      await expect(smoketestTeardownQuestBroker({ questId: QUEST_ID })).resolves.toBe(undefined);
    });
  });
});
