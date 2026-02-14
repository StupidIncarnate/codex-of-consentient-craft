import { GuildListItemStub } from '@dungeonmaster/shared/contracts';

import { orchestratorListGuildsAdapter } from './orchestrator-list-guilds-adapter';
import { orchestratorListGuildsAdapterProxy } from './orchestrator-list-guilds-adapter.proxy';

describe('orchestratorListGuildsAdapter', () => {
  describe('successful list', () => {
    it('VALID: {} => returns guild list items', async () => {
      const proxy = orchestratorListGuildsAdapterProxy();
      const guilds = [GuildListItemStub()];

      proxy.returns({ guilds });

      const result = await orchestratorListGuildsAdapter();

      expect(result).toStrictEqual(guilds);
    });

    it('VALID: {no guilds} => returns empty array', async () => {
      orchestratorListGuildsAdapterProxy();

      const result = await orchestratorListGuildsAdapter();

      expect(result).toStrictEqual([]);
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
