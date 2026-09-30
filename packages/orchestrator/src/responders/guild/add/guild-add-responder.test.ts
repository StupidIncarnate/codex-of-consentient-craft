import { GuildNameStub } from '@dungeonmaster/shared/contracts/guild-name/guild-name.stub';
import { GuildConfigStub } from '@dungeonmaster/shared/contracts/guild-config/guild-config.stub';

import { GuildAddResponderProxy } from './guild-add-responder.proxy';

describe('GuildAddResponder', () => {
  describe('delegation to broker', () => {
    it('VALID: {name, path} => delegates to guildAddBroker and returns created guild', async () => {
      const proxy = GuildAddResponderProxy();
      proxy.setupAddGuild({
        existingConfig: GuildConfigStub({ guilds: [] }),
        homeDir: '/home/user/.dungeonmaster',
        homePath: '/home/user/.dungeonmaster',
        guildsPath: '/home/user/.dungeonmaster/guilds',
        guildDirPath: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479',
        questsDirPath: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
      });

      const result = await proxy.callResponder({
        name: GuildNameStub({ value: 'My Guild' }),
        path: '/home/user/my-project',
      });

      const { name, path } = result;

      expect(name).toBe('My Guild');
      expect(path).toBe('/home/user/my-project');
    });
  });
});
