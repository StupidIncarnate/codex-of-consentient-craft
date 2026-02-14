import { GuildNameStub, GuildPathStub, GuildStub } from '@dungeonmaster/shared/contracts';

import { orchestratorAddGuildAdapter } from './orchestrator-add-guild-adapter';
import { orchestratorAddGuildAdapterProxy } from './orchestrator-add-guild-adapter.proxy';

describe('orchestratorAddGuildAdapter', () => {
  describe('successful add', () => {
    it('VALID: {name, path} => returns guild', async () => {
      const proxy = orchestratorAddGuildAdapterProxy();
      const name = GuildNameStub({ value: 'My Guild' });
      const path = GuildPathStub({ value: '/home/user/my-guild' });
      const guild = GuildStub({ name, path });

      proxy.returns({ guild });

      const result = await orchestratorAddGuildAdapter({ name, path });

      expect(result).toStrictEqual(guild);
    });

    it('VALID: {name, path} => returns guild with defaults', async () => {
      orchestratorAddGuildAdapterProxy();
      const name = GuildNameStub();
      const path = GuildPathStub();

      const result = await orchestratorAddGuildAdapter({ name, path });

      expect(result).toStrictEqual(GuildStub());
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorAddGuildAdapterProxy();
      const name = GuildNameStub();
      const path = GuildPathStub();

      proxy.throws({ error: new Error('Failed to add guild') });

      await expect(orchestratorAddGuildAdapter({ name, path })).rejects.toThrow(
        /Failed to add guild/u,
      );
    });
  });
});
