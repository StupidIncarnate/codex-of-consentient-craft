import { serverAppHarness } from '../../../test/harnesses/server-app/server-app.harness';
import { parseHealthResponseTransformer } from '../../transformers/parse-health-response/parse-health-response-transformer';
import { parseHealthStatusPayloadTransformer } from '../../transformers/parse-health-status-payload/parse-health-status-payload-transformer';

import { HealthFlow } from './health-flow';

describe('HealthFlow', () => {
  const harness = serverAppHarness();

  describe('GET /api/health', () => {
    it('VALID: {} => 200 with a body of exactly status ok and an ISO timestamp, no other keys', async () => {
      const app = HealthFlow();

      const response = await app.request('/api/health');
      const body: unknown = await response.json();
      const parsed = parseHealthResponseTransformer({ value: body });

      expect(response.status).toBe(200);
      expect(harness.toPlain(body)).toStrictEqual(parsed);
      expect(parsed).toStrictEqual({
        status: 'ok',
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u),
      });
    });
  });

  describe('GET /api/health/status', () => {
    it('VALID: {} => 200 with a body of exactly status, uptimeSeconds and version, no other keys', async () => {
      const app = HealthFlow();

      const response = await app.request('/api/health/status');
      const body: unknown = await response.json();
      const parsed = parseHealthStatusPayloadTransformer({ value: body });

      expect(response.status).toBe(200);
      expect(harness.toPlain(body)).toStrictEqual(parsed);
    });
  });
});
