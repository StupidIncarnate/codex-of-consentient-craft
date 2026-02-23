import { GuildListItemStub } from '@dungeonmaster/shared/contracts';
import { GuildListResponderProxy } from './guild-list-responder.proxy';

describe('GuildListResponder', () => {
  describe('successful listing', () => {
    it('VALID: {guilds exist} => returns 200 with guilds array', async () => {
      const proxy = GuildListResponderProxy();
      const guild = GuildListItemStub();
      proxy.setupListGuilds({ guilds: [guild] });

      const result = await proxy.callResponder();

      expect(result).toStrictEqual({
        status: 200,
        data: [guild],
      });
    });

    it('EMPTY: {no guilds} => returns 200 with empty array', async () => {
      const proxy = GuildListResponderProxy();
      proxy.setupListGuilds({ guilds: [] });

      const result = await proxy.callResponder();

      expect(result).toStrictEqual({
        status: 200,
        data: [],
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = GuildListResponderProxy();
      proxy.setupListGuildsError({ message: 'Connection failed' });

      const result = await proxy.callResponder();

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Connection failed' },
      });
    });
  });
});
