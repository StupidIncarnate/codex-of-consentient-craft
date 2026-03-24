import { FilePathStub, GuildConfigStub, GuildStub } from '@dungeonmaster/shared/contracts';

import { GuildListResponderProxy } from './guild-list-responder.proxy';

describe('GuildListResponder', () => {
  describe('delegation to broker', () => {
    it('VALID: {} => delegates to guildListBroker and returns guild list items', async () => {
      const proxy = GuildListResponderProxy();
      const guild = GuildStub({});
      proxy.setupGuildList({
        config: GuildConfigStub({ guilds: [guild] }),
        homeDir: '/home/user/.dungeonmaster',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildEntries: [
          {
            accessible: true,
            questsDirPath: FilePathStub({
              value: `/home/user/.dungeonmaster/guilds/${guild.id}/quests`,
            }),
            questDirEntries: [],
          },
        ],
      });

      const result = await proxy.callResponder();

      expect(result).toStrictEqual([
        {
          id: guild.id,
          name: guild.name,
          path: guild.path,
          urlSlug: guild.urlSlug,
          createdAt: guild.createdAt,
          valid: true,
          questCount: 0,
        },
      ]);
    });
  });
});
