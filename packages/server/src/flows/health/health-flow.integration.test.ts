import { serverAppHarness } from '../../../test/harnesses/server-app/server-app.harness';

import { HealthFlow } from './health-flow';

describe('HealthFlow', () => {
  const harness = serverAppHarness();

  describe('GET /api/health', () => {
    it('VALID: {} => 200 with a body of exactly {status: "ok", timestamp} and no other keys', async () => {
      const app = HealthFlow();

      const response = await app.request('/api/health');
      const body = harness.toPlain(await response.json());

      expect(response.status).toBe(200);
      expect(body).toStrictEqual({
        status: 'ok',
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u),
      });
    });
  });

  describe('GET /api/health/status', () => {
    it('VALID: {} => 200 with a body of exactly {status, uptimeSeconds, version} and no other keys', async () => {
      const app = HealthFlow();
      // Integration tests cannot import any proxy (enforce-test-proxy-imports allows the colocated
      // proxy exception only under src/startup/), so processUptimeAdapter's real, unmocked
      // process.uptime() cannot be pinned to an exact second here the way the adapter/broker/
      // responder unit tests do. Measuring the same global right before the request and comparing
      // with a wide tolerance keeps this assertion honest about a real value while staying immune
      // to the sub-millisecond drift between this read and the handler's own.
      const measuredUptimeSeconds = Math.floor(process.uptime());

      const response = await app.request('/api/health/status');
      const body = harness.toPlain(await response.json());

      expect(response.status).toBe(200);
      expect(body).toStrictEqual({
        status: 'ok',
        uptimeSeconds: expect.closeTo(measuredUptimeSeconds, -1),
        // Mirrors packages/server/package.json's current "version" field. serverVersionReadAdapter
        // reads that file for real in this integration test (no mocking available here), so this
        // literal drifts only if that field is bumped.
        version: '0.1.0',
      });
    });

    it('INVALID: {method: POST} => 404, the route is registered as GET only', async () => {
      const app = HealthFlow();

      const response = await app.request('/api/health/status', { method: 'POST' });

      expect(response.status).toBe(404);
    });
  });
});
