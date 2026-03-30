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

  describe('GET /', () => {
    it('VALID: {} => 302 redirect to web SPA port', async () => {
      const app = HealthFlow();

      const response = await app.request('/', { redirect: 'manual' });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toMatch(/^http:\/\/dungeonmaster\.localhost:\d+$/u);
    });
  });
});
