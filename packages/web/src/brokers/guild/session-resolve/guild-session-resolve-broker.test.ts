import { GuildIdStub, QuestIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { guildSessionResolveBroker } from './guild-session-resolve-broker';
import { guildSessionResolveBrokerProxy } from './guild-session-resolve-broker.proxy';

describe('guildSessionResolveBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {guildId, sessionId} => returns questId', async () => {
      const proxy = guildSessionResolveBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupResponse({ response: { questId } });

      const result = await guildSessionResolveBroker({ guildId, sessionId });

      expect(result).toStrictEqual({ questId });
    });

    it('VALID: {guildId, sessionId, no quest} => returns null questId', async () => {
      const proxy = guildSessionResolveBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });

      proxy.setupResponse({ response: { questId: null } });

      const result = await guildSessionResolveBroker({ guildId, sessionId });

      expect(result).toStrictEqual({ questId: null });
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = guildSessionResolveBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });

      proxy.setupError();

      await expect(guildSessionResolveBroker({ guildId, sessionId })).rejects.toThrow(/fetch/iu);
    });
  });
});
