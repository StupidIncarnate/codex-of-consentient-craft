import { serverAppHarness } from '../../../test/harnesses/server-app/server-app.harness';

import { OrchestrationFlow } from './orchestration-flow';

describe('OrchestrationFlow', () => {
  const harness = serverAppHarness();

  describe('GET /api/orchestration/dispatch', () => {
    it('VALID: {missing state file} => returns 200 with the paused default', async () => {
      const restore = harness.setupTestHome({ baseName: 'orchestration-flow-get' });
      const app = OrchestrationFlow();

      const response = await app.request('/api/orchestration/dispatch');
      const body: unknown = await response.json();

      restore();

      expect(response.status).toBe(200);
      expect(harness.toPlain(body)).toStrictEqual({
        state: {
          mode: 'paused',
          updatedAt: '1970-01-01T00:00:00.000Z',
        },
      });
    });
  });

  describe('POST /api/orchestration/dispatch/play', () => {
    it('VALID: {no launch loop active} => returns 200 allowed and persists node-playing', async () => {
      const restore = harness.setupTestHome({ baseName: 'orchestration-flow-play' });
      jest.useFakeTimers().setSystemTime(new Date('2024-01-15T10:00:00.000Z'));
      const app = OrchestrationFlow();

      const response = await app.request('/api/orchestration/dispatch/play', {
        method: 'POST',
      });
      const body: unknown = await response.json();

      jest.useRealTimers();
      restore();

      expect(response.status).toBe(200);
      expect(harness.toPlain(body)).toStrictEqual({
        allowed: true,
        state: {
          mode: 'node-playing',
          updatedAt: '2024-01-15T10:00:00.000Z',
        },
      });
    });
  });

  describe('POST /api/orchestration/dispatch/pause', () => {
    it('VALID: {} => returns 200 with the persisted paused state', async () => {
      const restore = harness.setupTestHome({ baseName: 'orchestration-flow-pause' });
      jest.useFakeTimers().setSystemTime(new Date('2024-01-15T10:00:00.000Z'));
      const app = OrchestrationFlow();

      const response = await app.request('/api/orchestration/dispatch/pause', {
        method: 'POST',
      });
      const body: unknown = await response.json();

      jest.useRealTimers();
      restore();

      expect(response.status).toBe(200);
      expect(harness.toPlain(body)).toStrictEqual({
        state: {
          mode: 'paused',
          updatedAt: '2024-01-15T10:00:00.000Z',
        },
      });
    });
  });
});
