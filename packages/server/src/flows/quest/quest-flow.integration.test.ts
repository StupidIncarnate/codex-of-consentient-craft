import { GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { serverAppHarness } from '../../../test/harnesses/server-app/server-app.harness';

import { QuestFlow } from './quest-flow';

describe('QuestFlow', () => {
  const harness = serverAppHarness();

  describe('GET /api/quests', () => {
    it('VALID: {missing guildId} => delegates to QuestListResponder which validates and returns 400', async () => {
      const app = QuestFlow();

      const response = await app.request('/api/quests');
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(harness.toPlain(body)).toStrictEqual({ error: 'guildId query parameter is required' });
    });
  });

  describe('GET /api/quests/:questId', () => {
    it('VALID: {questId} => delegates to QuestGetResponder and returns response', async () => {
      const app = QuestFlow();
      const questId = QuestIdStub();

      const response = await app.request(`/api/quests/${questId}`);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/quests', () => {
    it('VALID: {missing title} => delegates to QuestAddResponder which validates and returns 400', async () => {
      const app = QuestFlow();
      const guildId = GuildIdStub();

      const response = await app.request('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRequest: 'Build it', guildId }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(harness.toPlain(body)).toStrictEqual({
        error: 'title and userRequest are required strings',
      });
    });
  });

  describe('PATCH /api/quests/:questId', () => {
    it('VALID: {questId, body} => delegates to QuestModifyResponder and returns response', async () => {
      const app = QuestFlow();
      const questId = QuestIdStub();

      const response = await app.request(`/api/quests/${questId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/quests/:questId/verify', () => {
    it('VALID: {questId} => delegates to QuestVerifyResponder and returns response', async () => {
      const app = QuestFlow();
      const questId = QuestIdStub();

      const response = await app.request(`/api/quests/${questId}/verify`, {
        method: 'POST',
      });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/quests/:questId/start', () => {
    it('VALID: {questId} => delegates to QuestStartResponder and returns response', async () => {
      const app = QuestFlow();
      const questId = QuestIdStub();

      const response = await app.request(`/api/quests/${questId}/start`, {
        method: 'POST',
      });
      const body: unknown = await response.json();

      expect(harness.toPlain(body)).toStrictEqual({
        error: expect.stringMatching(/^Quest not found: add-auth$/u),
      });
    });
  });
});
