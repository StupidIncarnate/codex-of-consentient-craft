import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';

import { GuildIdStub } from '@dungeonmaster/shared/contracts';
import { environmentStatics } from '@dungeonmaster/shared/statics';

import { GuildFlow } from './guild-flow';

const toPlain = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

const setupTestHome = ({ baseName }: { baseName: string }): (() => void) => {
  const savedDungeonmasterHome = process.env.DUNGEONMASTER_HOME;
  const tempDir = join(tmpdir(), `${baseName}-${randomUUID().slice(0, 8)}`);
  process.env.DUNGEONMASTER_HOME = tempDir;
  const dmDir = join(tempDir, environmentStatics.testDataDir);
  mkdirSync(dmDir, { recursive: true });
  writeFileSync(join(dmDir, 'config.json'), JSON.stringify({ guilds: [] }));

  return (): void => {
    if (savedDungeonmasterHome === undefined) {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
    } else {
      process.env.DUNGEONMASTER_HOME = savedDungeonmasterHome;
    }
    rmSync(tempDir, { recursive: true, force: true });
  };
};

describe('GuildFlow', () => {
  describe('GET /api/guilds', () => {
    it('VALID: {} => delegates to GuildListResponder and returns 200', async () => {
      const restore = setupTestHome({ baseName: 'server-guild-list' });
      const app = GuildFlow();

      const response = await app.request('/api/guilds');

      restore();

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/guilds', () => {
    it('VALID: {missing name} => delegates to GuildAddResponder which validates and returns 400', async () => {
      const restore = setupTestHome({ baseName: 'server-guild-add' });
      const app = GuildFlow();

      const response = await app.request('/api/guilds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/test/path' }),
      });
      const body: unknown = await response.json();

      restore();

      expect(response.status).toBe(400);
      expect(toPlain(body)).toStrictEqual({ error: 'name and path are required strings' });
    });
  });

  describe('GET /api/guilds/:guildId', () => {
    it('VALID: {guildId} => delegates to GuildGetResponder and returns response', async () => {
      const restore = setupTestHome({ baseName: 'server-guild-get' });
      const app = GuildFlow();
      const guildId = GuildIdStub();

      const response = await app.request(`/api/guilds/${guildId}`);
      const body: unknown = await response.json();

      restore();

      expect(typeof Reflect.get(toPlain(body) as object, 'error')).toBe('string');
    });
  });

  describe('PATCH /api/guilds/:guildId', () => {
    it('VALID: {non-object body} => delegates to GuildUpdateResponder which validates and returns 400', async () => {
      const restore = setupTestHome({ baseName: 'server-guild-patch' });
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
      expect(toPlain(body)).toStrictEqual({ error: 'Request body must be a JSON object' });
    });
  });

  describe('DELETE /api/guilds/:guildId', () => {
    it('VALID: {guildId} => delegates to GuildRemoveResponder and returns response', async () => {
      const restore = setupTestHome({ baseName: 'server-guild-delete' });
      const app = GuildFlow();
      const guildId = GuildIdStub();

      const response = await app.request(`/api/guilds/${guildId}`, {
        method: 'DELETE',
      });
      const body: unknown = await response.json();

      restore();

      expect(typeof Reflect.get(toPlain(body) as object, 'error')).toBe('string');
    });
  });
});
