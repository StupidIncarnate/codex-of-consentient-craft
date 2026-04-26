import { parseHealthResponseTransformer } from '../../transformers/parse-health-response/parse-health-response-transformer';

import { HealthFlow } from './health-flow';

describe('HealthFlow', () => {
  describe('GET /api/health', () => {
    it('VALID: {} => 200 with status ok and timestamp', async () => {
      const app = HealthFlow();

      const response = await app.request('/api/health');
      const body: unknown = await response.json();
      const parsed = parseHealthResponseTransformer({ value: body });

      expect(response.status).toBe(200);
      expect(parsed?.status).toBe('ok');
    });
  });
});
