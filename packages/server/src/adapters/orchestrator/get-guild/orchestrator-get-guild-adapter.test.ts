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
      const proxy = orchestratorGetGuildAdapterProxy();
      const guildId = GuildIdStub();
      const guild = GuildStub({ id: guildId });

      proxy.returns({ guild });

      const result = await orchestratorGetGuildAdapter({ guildId });

      expect(result).toStrictEqual(guild);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorGetGuildAdapterProxy();
      const guildId = GuildIdStub();

      proxy.throws({ guildId, error: new Error('Guild not found') });

      await expect(orchestratorGetGuildAdapter({ guildId })).rejects.toThrow(/Guild not found/u);
    });
  });
});
