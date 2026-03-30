import { GuildIdStub } from '@dungeonmaster/shared/contracts';

import { serverAppHarness } from '../../../test/harnesses/server-app/server-app.harness';

import { GuildFlow } from './guild-flow';

describe('GuildFlow', () => {
  const harness = serverAppHarness();

  describe('GET /api/guilds', () => {
    it('VALID: {} => delegates to GuildListResponder and returns 200', async () => {
      const restore = harness.setupTestHome({ baseName: 'server-guild-list' });
      const app = GuildFlow();

      const response = await app.request('/api/guilds');

      restore();

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/guilds', () => {
    it('VALID: {missing name} => delegates to GuildAddResponder which validates and returns 400', async () => {
      const restore = harness.setupTestHome({ baseName: 'server-guild-add' });
      const app = GuildFlow();

      const response = await app.request('/api/guilds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/test/path' }),
      });
      const body: unknown = await response.json();

      restore();

      expect(response.status).toBe(400);
      expect(harness.toPlain(body)).toStrictEqual({ error: 'name and path are required strings' });
    });
  });

  describe('GET /api/guilds/:guildId', () => {
    it('VALID: {guildId} => delegates to GuildGetResponder and returns response', async () => {
      const restore = harness.setupTestHome({ baseName: 'server-guild-get' });
      const app = GuildFlow();
      const guildId = GuildIdStub();

      const response = await app.request(`/api/guilds/${guildId}`);
      const body: unknown = await response.json();

      restore();

      expect(harness.toPlain(body)).toStrictEqual({
        error: expect.stringMatching(
          /^Guild not found: [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u,
        ),
      });
    });
  });

  describe('PATCH /api/guilds/:guildId', () => {
    it('VALID: {non-object body} => delegates to GuildUpdateResponder which validates and returns 400', async () => {
      const restore = harness.setupTestHome({ baseName: 'server-guild-patch' });
      const app = GuildFlow();
      const guildId = GuildIdStub();

      const response = await app.request(`/api/guilds/${guildId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify('not-an-object'),
      });
      const body: unknown = await response.json();

      restore();

      expect(response.status).toBe(400);
      expect(harness.toPlain(body)).toStrictEqual({ error: 'Request body must be a JSON object' });
    });
  });

  describe('DELETE /api/guilds/:guildId', () => {
    it('VALID: {guildId} => delegates to GuildRemoveResponder and returns response', async () => {
      const restore = harness.setupTestHome({ baseName: 'server-guild-delete' });
      const app = GuildFlow();
      const guildId = GuildIdStub();

      const response = await app.request(`/api/guilds/${guildId}`, {
        method: 'DELETE',
      });
      const body: unknown = await response.json();

      restore();

      expect(harness.toPlain(body)).toStrictEqual({
        error: expect.stringMatching(
          /^Guild not found: [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u,
        ),
      });
    });
  });
});
