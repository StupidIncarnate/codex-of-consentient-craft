import { guildSessionPersistBroker } from './guild-session-persist-broker';
import { guildSessionPersistBrokerProxy } from './guild-session-persist-broker.proxy';
import { GuildStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

type SessionId = ReturnType<typeof SessionIdStub>;
type Guild = ReturnType<typeof GuildStub>;

describe('guildSessionPersistBroker', () => {
  describe('successful persist', () => {
    it('VALID: {guildId, sessionId, no existing sessions} => calls update with new active session', async () => {
      const proxy = guildSessionPersistBrokerProxy();
      const sessionId: SessionId = SessionIdStub({ value: 'test-session-id-123' });
      const guild: Guild = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        chatSessions: [],
      });

      proxy.setupGuildFound({ guild });
      proxy.setupUpdateReturns({ guild });

      await guildSessionPersistBroker({
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        sessionId,
      });

      const callArgs = proxy.getUpdateCallArgs();

      expect(callArgs).toStrictEqual([
        {
          guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          chatSessions: [
            {
              sessionId: 'test-session-id-123',
              agentRole: 'chaoswhisperer',
              startedAt: '2026-02-14T00:00:00.000Z',
              active: true,
            },
          ],
        },
      ]);
    });

    it('VALID: {guildId with existing active session} => deactivates previous and adds new', async () => {
      const proxy = guildSessionPersistBrokerProxy();
      const sessionId: SessionId = SessionIdStub({ value: 'new-session-456' });
      const guild: Guild = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        chatSessions: [
          {
            sessionId: 'old-session-789',
            agentRole: 'chaoswhisperer',
            startedAt: '2026-01-01T00:00:00.000Z',
            active: true,
          },
        ],
      });

      proxy.setupGuildFound({ guild });
      proxy.setupUpdateReturns({ guild });

      await guildSessionPersistBroker({
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        sessionId,
      });

      const callArgs = proxy.getUpdateCallArgs();

      expect(callArgs).toStrictEqual([
        {
          guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          chatSessions: [
            {
              sessionId: 'old-session-789',
              agentRole: 'chaoswhisperer',
              startedAt: '2026-01-01T00:00:00.000Z',
              active: false,
            },
            {
              sessionId: 'new-session-456',
              agentRole: 'chaoswhisperer',
              startedAt: '2026-02-14T00:00:00.000Z',
              active: true,
            },
          ],
        },
      ]);
    });
  });

  describe('duplicate sessionId', () => {
    it('VALID: {guildId with same sessionId already exists} => updates existing instead of duplicating', async () => {
      const proxy = guildSessionPersistBrokerProxy();
      const sessionId: SessionId = SessionIdStub({ value: 'same-session-123' });
      const guild: Guild = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        chatSessions: [
          {
            sessionId: 'same-session-123',
            agentRole: 'chaoswhisperer',
            startedAt: '2026-01-01T00:00:00.000Z',
            active: false,
          },
        ],
      });

      proxy.setupGuildFound({ guild });
      proxy.setupUpdateReturns({ guild });

      await guildSessionPersistBroker({
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        sessionId,
      });

      const callArgs = proxy.getUpdateCallArgs();

      expect(callArgs).toStrictEqual([
        {
          guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          chatSessions: [
            {
              sessionId: 'same-session-123',
              agentRole: 'chaoswhisperer',
              startedAt: '2026-02-14T00:00:00.000Z',
              active: true,
            },
          ],
        },
      ]);
    });

    it('VALID: {guildId with same sessionId among others} => updates matching, deactivates rest, no duplicates', async () => {
      const proxy = guildSessionPersistBrokerProxy();
      const sessionId: SessionId = SessionIdStub({ value: 'same-session-123' });
      const guild: Guild = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        chatSessions: [
          {
            sessionId: 'other-session-000',
            agentRole: 'chaoswhisperer',
            startedAt: '2025-12-01T00:00:00.000Z',
            active: false,
          },
          {
            sessionId: 'same-session-123',
            agentRole: 'chaoswhisperer',
            startedAt: '2026-01-01T00:00:00.000Z',
            active: true,
          },
        ],
      });

      proxy.setupGuildFound({ guild });
      proxy.setupUpdateReturns({ guild });

      await guildSessionPersistBroker({
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        sessionId,
      });

      const callArgs = proxy.getUpdateCallArgs();

      expect(callArgs).toStrictEqual([
        {
          guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          chatSessions: [
            {
              sessionId: 'other-session-000',
              agentRole: 'chaoswhisperer',
              startedAt: '2025-12-01T00:00:00.000Z',
              active: false,
            },
            {
              sessionId: 'same-session-123',
              agentRole: 'chaoswhisperer',
              startedAt: '2026-02-14T00:00:00.000Z',
              active: true,
            },
          ],
        },
      ]);
    });
  });

  describe('adapter throws', () => {
    it('ERROR: {get guild throws} => catches error without throwing', async () => {
      const proxy = guildSessionPersistBrokerProxy();
      const sessionId: SessionId = SessionIdStub({ value: 'test-session-id-123' });

      proxy.setupGetGuildThrows({ error: new Error('Network error') });

      await expect(
        guildSessionPersistBroker({
          guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          sessionId,
        }),
      ).resolves.toBeUndefined();
    });
  });
});
