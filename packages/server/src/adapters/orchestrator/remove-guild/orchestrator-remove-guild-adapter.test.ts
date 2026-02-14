import { GuildIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorRemoveGuildAdapter } from './orchestrator-remove-guild-adapter';
import { orchestratorRemoveGuildAdapterProxy } from './orchestrator-remove-guild-adapter.proxy';

describe('orchestratorRemoveGuildAdapter', () => {
  describe('successful remove', () => {
    it('VALID: {guildId} => returns void', async () => {
      orchestratorRemoveGuildAdapterProxy();
      const guildId = GuildIdStub();

      await expect(orchestratorRemoveGuildAdapter({ guildId })).resolves.toBeUndefined();
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorRemoveGuildAdapterProxy();
      const guildId = GuildIdStub();

      proxy.throws({ error: new Error('Failed to remove guild') });

      await expect(orchestratorRemoveGuildAdapter({ guildId })).rejects.toThrow(
        /Failed to remove guild/u,
      );
    });
  });
});
