import { GuildIdStub } from '@dungeonmaster/shared/contracts';

import { GuildFlow } from './guild-flow';

const toPlain = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

describe('GuildFlow', () => {
  describe('GET /api/guilds', () => {
    it('VALID: {} => delegates to GuildListResponder and returns 200', async () => {
      const app = GuildFlow();

      const response = await app.request('/api/guilds');

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/guilds', () => {
    it('VALID: {missing name} => delegates to GuildAddResponder which validates and returns 400', async () => {
      const app = GuildFlow();

      const response = await app.request('/api/guilds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/test/path' }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(toPlain(body)).toStrictEqual({ error: 'name and path are required strings' });
    });
  });

  describe('GET /api/guilds/:guildId', () => {
    it('VALID: {guildId} => delegates to GuildGetResponder and returns response', async () => {
      const app = GuildFlow();
      const guildId = GuildIdStub();

      const response = await app.request(`/api/guilds/${guildId}`);
      const body: unknown = await response.json();

      expect(typeof Reflect.get(toPlain(body) as object, 'error')).toBe('string');
    });
  });

  describe('PATCH /api/guilds/:guildId', () => {
    it('VALID: {non-object body} => delegates to GuildUpdateResponder which validates and returns 400', async () => {
      const app = GuildFlow();
      const guildId = GuildIdStub();

      const response = await app.request(`/api/guilds/${guildId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify('not-an-object'),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(toPlain(body)).toStrictEqual({ error: 'Request body must be a JSON object' });
    });
  });

  describe('DELETE /api/guilds/:guildId', () => {
    it('VALID: {guildId} => delegates to GuildRemoveResponder and returns response', async () => {
      const app = GuildFlow();
      const guildId = GuildIdStub();

      const response = await app.request(`/api/guilds/${guildId}`, {
        method: 'DELETE',
      });
      const body: unknown = await response.json();

      expect(typeof Reflect.get(toPlain(body) as object, 'error')).toBe('string');
    });
  });
});
