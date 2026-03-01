import { GuildIdStub, ProcessIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { ChatReplayFlow } from './chat-replay-flow';

describe('ChatReplayFlow', () => {
  describe('export', () => {
    it('VALID: ChatReplayFlow => exports an async function', () => {
      expect(typeof ChatReplayFlow).toBe('function');
    });
  });

  describe('delegation to responder', () => {
    it('ERROR: {guildId: nonexistent} => rejects with guild not found', async () => {
      const sessionId = SessionIdStub({ value: 'session-replay-integration' });
      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });

      await expect(ChatReplayFlow({ sessionId, guildId })).rejects.toThrow(/Guild not found/u);
    });

    it('ERROR: {guildId: nonexistent, chatProcessId: provided} => rejects with guild not found', async () => {
      const sessionId = SessionIdStub({ value: 'session-replay-with-process' });
      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });
      const chatProcessId = ProcessIdStub({ value: 'replay-explicit-process-id' });

      await expect(ChatReplayFlow({ sessionId, guildId, chatProcessId })).rejects.toThrow(
        /Guild not found/u,
      );
    });
  });

  describe('chatProcessId passthrough', () => {
    it('ERROR: {chatProcessId: omitted} => auto-generates process id and still rejects with guild not found', async () => {
      const sessionId = SessionIdStub({ value: 'session-no-process-id' });
      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });

      await expect(ChatReplayFlow({ sessionId, guildId })).rejects.toThrow(/Guild not found/u);
    });
  });
});
