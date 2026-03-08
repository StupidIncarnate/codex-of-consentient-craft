import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { DesignFlow } from './design-flow';

const toPlain = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

describe('DesignFlow', () => {
  describe('POST /api/quests/:questId/design/start', () => {
    it('VALID: {missing body} => delegates to DesignStartResponder which validates and returns 400', async () => {
      const app = DesignFlow();
      const questId = QuestIdStub();

      const response = await app.request(`/api/quests/${questId}/design/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(toPlain(body)).toStrictEqual({ error: 'guildId is required' });
    });
  });

  describe('POST /api/quests/:questId/design/stop', () => {
    it('VALID: {questId with no running process} => returns 404', async () => {
      const app = DesignFlow();
      const questId = QuestIdStub();

      const response = await app.request(`/api/quests/${questId}/design/stop`, {
        method: 'POST',
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(404);
      expect(toPlain(body)).toStrictEqual({
        error: 'No running design sandbox for this quest',
      });
    });
  });

  describe('POST /api/quests/:questId/design/session', () => {
    it('VALID: {missing body} => delegates to DesignSessionResponder which validates and returns 400', async () => {
      const app = DesignFlow();
      const questId = QuestIdStub();

      const response = await app.request(`/api/quests/${questId}/design/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(toPlain(body)).toStrictEqual({ error: 'guildId is required' });
    });
  });
});
