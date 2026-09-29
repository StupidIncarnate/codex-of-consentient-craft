import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { SessionListItemStub } from '@dungeonmaster/shared/contracts/session-list-item/session-list-item.stub';

import { guildSessionListBroker } from './guild-session-list-broker';
import { guildSessionListBrokerProxy } from './guild-session-list-broker.proxy';

describe('guildSessionListBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {guildId} => returns session list', async () => {
      const proxy = guildSessionListBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const session = SessionListItemStub();
      const sessions = [session];

      proxy.setupSessions({ sessions });

      const result = await guildSessionListBroker({ guildId });

      expect(result).toStrictEqual([session]);
    });

    it('EMPTY: {guildId} => returns empty array when no sessions', async () => {
      const proxy = guildSessionListBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessions: unknown[] = [];

      proxy.setupSessions({ sessions });

      const result = await guildSessionListBroker({ guildId });

      expect(result).toStrictEqual([]);
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = guildSessionListBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupError();

      await expect(guildSessionListBroker({ guildId })).rejects.toThrow(/^Failed to fetch$/u);
    });
  });
});
