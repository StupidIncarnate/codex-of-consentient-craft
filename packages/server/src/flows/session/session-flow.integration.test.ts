import { GuildIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { serverAppHarness } from '../../../test/harnesses/server-app/server-app.harness';

import { SessionFlow } from './session-flow';

describe('SessionFlow', () => {
  const harness = serverAppHarness();

  describe('POST /api/sessions/new', () => {
    it('VALID: {missing message} => delegates to SessionNewResponder which validates and returns 400', async () => {
      const app = SessionFlow();
      const guildId = GuildIdStub();

      const response = await app.request('/api/sessions/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(harness.toPlain(body)).toStrictEqual({ error: 'message is required' });
    });
  });

  describe('GET /api/guilds/:guildId/sessions', () => {
    it('VALID: {guildId} => delegates to SessionListResponder and returns response', async () => {
      const app = SessionFlow();
      const guildId = GuildIdStub();

      const response = await app.request(`/api/guilds/${guildId}/sessions`);
      const body: unknown = await response.json();

      expect(typeof Reflect.get(harness.toPlain(body) as object, 'error')).toBe('string');
    });
  });

  describe('POST /api/sessions/:sessionId/chat', () => {
    it('VALID: {missing message} => delegates to SessionChatResponder which validates and returns 400', async () => {
      const app = SessionFlow();
      const sessionId = SessionIdStub();
      const guildId = GuildIdStub();

      const response = await app.request(`/api/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(harness.toPlain(body)).toStrictEqual({ error: 'message is required' });
    });
  });

  describe('POST /api/sessions/:sessionId/chat/:chatProcessId/stop', () => {
    it('VALID: {non-existent process} => delegates to SessionChatStopResponder which returns 404', async () => {
      const app = SessionFlow();
      const sessionId = SessionIdStub();

      const response = await app.request(`/api/sessions/${sessionId}/chat/fake-process-id/stop`, {
        method: 'POST',
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(404);
      expect(harness.toPlain(body)).toStrictEqual({ error: 'Process not found or already exited' });
    });
  });
});
