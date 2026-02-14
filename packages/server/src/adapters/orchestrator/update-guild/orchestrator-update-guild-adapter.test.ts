import {
  GuildIdStub,
  GuildNameStub,
  GuildPathStub,
  GuildStub,
} from '@dungeonmaster/shared/contracts';

import { orchestratorUpdateGuildAdapter } from './orchestrator-update-guild-adapter';
import { orchestratorUpdateGuildAdapterProxy } from './orchestrator-update-guild-adapter.proxy';

describe('orchestratorUpdateGuildAdapter', () => {
  describe('successful update', () => {
    it('VALID: {guildId, name, path} => returns updated guild', async () => {
      const proxy = orchestratorUpdateGuildAdapterProxy();
      const guildId = GuildIdStub();
      const name = GuildNameStub({ value: 'Updated Guild' });
      const path = GuildPathStub({ value: '/home/user/updated' });
      const guild = GuildStub({ id: guildId, name, path });

      proxy.returns({ guild });

      const result = await orchestratorUpdateGuildAdapter({ guildId, name, path });

      expect(result).toStrictEqual(guild);
    });

    it('VALID: {guildId, name only} => returns updated guild', async () => {
      orchestratorUpdateGuildAdapterProxy();
      const guildId = GuildIdStub();
      const name = GuildNameStub({ value: 'Renamed' });

      const result = await orchestratorUpdateGuildAdapter({ guildId, name });

      expect(result).toStrictEqual(GuildStub());
    });

    it('VALID: {guildId, path only} => returns updated guild', async () => {
      orchestratorUpdateGuildAdapterProxy();
      const guildId = GuildIdStub();
      const path = GuildPathStub({ value: '/new/path' });

      const result = await orchestratorUpdateGuildAdapter({ guildId, path });

      expect(result).toStrictEqual(GuildStub());
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorUpdateGuildAdapterProxy();
      const guildId = GuildIdStub();

      proxy.throws({ error: new Error('Failed to update guild') });

      await expect(orchestratorUpdateGuildAdapter({ guildId })).rejects.toThrow(
        /Failed to update guild/u,
      );
    });
  });
});
