import {
  GuildNameStub,
  GuildPathStub,
  FilePathStub,
  GuildConfigStub,
} from '@dungeonmaster/shared/contracts';

import { GuildAddResponderProxy } from './guild-add-responder.proxy';

describe('GuildAddResponder', () => {
  describe('delegation to broker', () => {
    it('VALID: {name, path} => delegates to guildAddBroker and returns created guild', async () => {
      const proxy = GuildAddResponderProxy();
      proxy.setupAddGuild({
        existingConfig: GuildConfigStub({ guilds: [] }),
        homeDir: '/home/user/.dungeonmaster',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsPath: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
        guildDirPath: FilePathStub({
          value: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479',
        }),
        questsDirPath: FilePathStub({
          value: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
        }),
      });

      const result = await proxy.callResponder({
        name: GuildNameStub({ value: 'My Guild' }),
        path: GuildPathStub({ value: '/home/user/my-project' }),
      });

      expect(result.name).toBe('My Guild');
      expect(result.path).toBe('/home/user/my-project');
    });
  });
});
