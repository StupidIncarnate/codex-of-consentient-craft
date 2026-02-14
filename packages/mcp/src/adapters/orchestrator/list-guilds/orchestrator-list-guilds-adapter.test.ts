import { GuildListItemStub } from '@dungeonmaster/shared/contracts';

import { orchestratorListGuildsAdapter } from './orchestrator-list-guilds-adapter';
import { orchestratorListGuildsAdapterProxy } from './orchestrator-list-guilds-adapter.proxy';

describe('orchestratorListGuildsAdapter', () => {
  describe('successful list', () => {
    it('VALID: no input => returns empty array', async () => {
      const proxy = orchestratorListGuildsAdapterProxy();

      proxy.returns({ guilds: [] });

      const result = await orchestratorListGuildsAdapter();

      expect(result).toStrictEqual([]);
    });

    it('VALID: guilds exist => returns guild list items', async () => {
      const proxy = orchestratorListGuildsAdapterProxy();
      const guild = GuildListItemStub({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'My Guild',
        path: '/home/user/my-guild',
        valid: true,
        questCount: 3,
      });

      proxy.returns({ guilds: [guild] });

      const result = await orchestratorListGuildsAdapter();

      expect(result).toStrictEqual([guild]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorListGuildsAdapterProxy();

      proxy.throws({ error: new Error('Failed to list guilds') });

      await expect(orchestratorListGuildsAdapter()).rejects.toThrow(/Failed to list guilds/u);
    });
  });
});
