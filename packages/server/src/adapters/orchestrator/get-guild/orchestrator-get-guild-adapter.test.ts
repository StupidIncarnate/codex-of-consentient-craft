import { GuildIdStub, GuildStub } from '@dungeonmaster/shared/contracts';

import { orchestratorGetGuildAdapter } from './orchestrator-get-guild-adapter';
import { orchestratorGetGuildAdapterProxy } from './orchestrator-get-guild-adapter.proxy';

describe('orchestratorGetGuildAdapter', () => {
  describe('successful get', () => {
    it('VALID: {guildId} => returns guild', async () => {
      const proxy = orchestratorGetGuildAdapterProxy();
      const guildId = GuildIdStub();
      const guild = GuildStub({ id: guildId });

      proxy.returns({ guild });

      const result = await orchestratorGetGuildAdapter({ guildId });

      expect(result).toStrictEqual(guild);
    });

    it('VALID: {guildId} => returns guild with defaults', async () => {
      orchestratorGetGuildAdapterProxy();
      const guildId = GuildIdStub();

      const result = await orchestratorGetGuildAdapter({ guildId });

      expect(result).toStrictEqual(GuildStub());
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorGetGuildAdapterProxy();
      const guildId = GuildIdStub();

      proxy.throws({ error: new Error('Guild not found') });

      await expect(orchestratorGetGuildAdapter({ guildId })).rejects.toThrow(/Guild not found/u);
    });
  });
});
