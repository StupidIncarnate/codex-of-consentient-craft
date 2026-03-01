import { GuildIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { ChatStartFlow } from './chat-start-flow';

describe('ChatStartFlow', () => {
  describe('export', () => {
    it('VALID: ChatStartFlow => exports an async function', () => {
      expect(typeof ChatStartFlow).toBe('function');
    });
  });

  describe('delegation to responder', () => {
    it('ERROR: {guildId: nonexistent, message} => throws guild not found', async () => {
      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });

      await expect(ChatStartFlow({ guildId, message: 'Help me build auth' })).rejects.toThrow(
        /Guild not found/u,
      );
    });

    it('ERROR: {guildId: nonexistent, message, sessionId} => with optional sessionId, throws guild not found', async () => {
      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });
      const sessionId = SessionIdStub({ value: 'session-abc123' });

      await expect(
        ChatStartFlow({ guildId, message: 'Continue our chat', sessionId }),
      ).rejects.toThrow(/Guild not found/u);
    });
  });
});
