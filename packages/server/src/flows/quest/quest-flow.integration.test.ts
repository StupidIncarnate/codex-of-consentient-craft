import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

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

  describe('GET /api/quests/:questId/ward-results/:wardResultId', () => {
    it('VALID: {questId without matching quest} => delegates to QuestWardDetailResponder and returns 404', async () => {
      const app = QuestFlow();
      const questId = QuestIdStub();
      const wardResultId = '22222222-2222-4222-8222-222222222222';

      const response = await app.request(`/api/quests/${questId}/ward-results/${wardResultId}`);

      expect(response.status).toBe(404);
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

  describe('POST /api/quests/:questId/start', () => {
    it('VALID: {questId without matching quest} => delegates to QuestStartResponder and returns 400 quest-not-found', async () => {
      const app = QuestFlow();
      const questId = QuestIdStub();

      const response = await app.request(`/api/quests/${questId}/start`, {
        method: 'POST',
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(harness.toPlain(body)).toStrictEqual({
        error: 'Quest not found',
      });
    });
  });

  describe('POST /api/quests/:questId/resume', () => {
    it('VALID: {questId without matching quest} => delegates to QuestResumeResponder and returns 400 quest-not-found', async () => {
      const app = QuestFlow();
      const questId = QuestIdStub();

      const response = await app.request(`/api/quests/${questId}/resume`, {
        method: 'POST',
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(harness.toPlain(body)).toStrictEqual({
        error: 'Quest not found',
      });
    });
  });

  describe('POST /api/quests/:questId/signal-back (env-gated)', () => {
    it('INVALID: {E2E_SIGNAL_BACK_HTTP=1, body missing workItemId} => 400 route registered, responder validates before the orchestrator call', async () => {
      process.env.E2E_SIGNAL_BACK_HTTP = '1';
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const app = QuestFlow();

      const response = await app.request(`/api/quests/${questId}/signal-back`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal: 'complete' }),
      });
      const body: unknown = await response.json();

      Reflect.deleteProperty(process.env, 'E2E_SIGNAL_BACK_HTTP');

      expect(response.status).toBe(400);
      expect(harness.toPlain(body)).toStrictEqual({ error: 'Invalid signal-back input' });
    });

    it('VALID: {E2E_SIGNAL_BACK_HTTP=1, valid body, no matching quest} => 500 drives the real StartOrchestrator.handleSignalBack which surfaces the missing-quest error', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-signal-back' });
      process.env.E2E_SIGNAL_BACK_HTTP = '1';
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
      const app = QuestFlow();

      const response = await app.request(`/api/quests/${questId}/signal-back`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workItemId, signal: 'complete', operationStatus: 'done' }),
      });

      restore();
      Reflect.deleteProperty(process.env, 'E2E_SIGNAL_BACK_HTTP');

      expect(response.status).toBe(500);
    });

    it('VALID: {E2E_SIGNAL_BACK_HTTP unset} => 404 route not registered so production never exposes it', async () => {
      Reflect.deleteProperty(process.env, 'E2E_SIGNAL_BACK_HTTP');
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
      const app = QuestFlow();

      const response = await app.request(`/api/quests/${questId}/signal-back`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workItemId, signal: 'complete' }),
      });

      expect(response.status).toBe(404);
    });
  });
});
