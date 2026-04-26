import { FilePathStub, GuildConfigStub, GuildStub } from '@dungeonmaster/shared/contracts';

import { smoketestEnsureGuildBroker } from './smoketest-ensure-guild-broker';
import { smoketestEnsureGuildBrokerProxy } from './smoketest-ensure-guild-broker.proxy';

const SMOKETEST_GUILD_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const SMOKETEST_HOME = '/home/testuser/.dungeonmaster';

describe('smoketestEnsureGuildBroker', () => {
  describe('existing smoketest guild', () => {
    it('VALID: {config already contains guild named smoketests} => returns the existing guild id without creating a new guild', async () => {
      const proxy = smoketestEnsureGuildBrokerProxy();
      proxy.setupPassthrough();

      const existingSmoketestGuild = GuildStub({
        id: SMOKETEST_GUILD_ID,
        name: 'smoketests',
        path: SMOKETEST_HOME,
        createdAt: '2024-01-15T10:00:00.000Z',
      });

      proxy.setupGuildPresent({
        config: GuildConfigStub({ guilds: [existingSmoketestGuild] }),
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: SMOKETEST_HOME }),
        guildEntries: [
          {
            accessible: true,
            questsDirPath: FilePathStub({
              value: `${SMOKETEST_HOME}/guilds/${SMOKETEST_GUILD_ID}/quests`,
            }),
            questDirEntries: [],
          },
        ],
      });

      const result = await smoketestEnsureGuildBroker();

      expect(result).toStrictEqual({ guildId: SMOKETEST_GUILD_ID });
    });
  });
});
