import { HealthFlow } from './health-flow';

describe('HealthFlow', () => {
  describe('GET /api/health', () => {
    it('VALID: {} => 200 with status ok and timestamp', async () => {
      const app = HealthFlow();

      const response = await app.request('/api/health');
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(Reflect.get(body as object, 'status')).toBe('ok');
    });
  });
});
