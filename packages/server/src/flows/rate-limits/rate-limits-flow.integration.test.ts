import { serverAppHarness } from '../../../test/harnesses/server-app/server-app.harness';

import { RateLimitsFlow } from './rate-limits-flow';

describe('RateLimitsFlow', () => {
  const harness = serverAppHarness();

  describe('GET /api/rate-limits', () => {
    it('VALID: {default orchestrator state} => delegates to RateLimitsGetResponder and returns 200 with {snapshot: null}', async () => {
      const app = RateLimitsFlow();

      const response = await app.request('/api/rate-limits');
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(harness.toPlain(body)).toStrictEqual({ snapshot: null });
    });

    it('VALID: {repeated invocation} => GET /api/rate-limits remains idempotent and returns 200 each call', async () => {
      const app = RateLimitsFlow();

      const firstResponse = await app.request('/api/rate-limits');
      const firstBody: unknown = await firstResponse.json();
      const secondResponse = await app.request('/api/rate-limits');
      const secondBody: unknown = await secondResponse.json();

      expect(firstResponse.status).toBe(200);
      expect(harness.toPlain(firstBody)).toStrictEqual({ snapshot: null });
      expect(secondResponse.status).toBe(200);
      expect(harness.toPlain(secondBody)).toStrictEqual({ snapshot: null });
    });
  });
});
