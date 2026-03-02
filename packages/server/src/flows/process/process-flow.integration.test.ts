import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { ProcessFlow } from './process-flow';

describe('ProcessFlow', () => {
  describe('GET /api/process/:processId', () => {
    it('VALID: {processId} => delegates to ProcessStatusResponder and returns response', async () => {
      const app = ProcessFlow();
      const processId = ProcessIdStub();

      const response = await app.request(`/api/process/${processId}`);
      const body: unknown = await response.json();

      expect(typeof body).toBe('object');
      expect(body).not.toBeNull();
    });
  });

  describe('GET /api/process/:processId/output', () => {
    it('VALID: {processId} => delegates to ProcessOutputResponder and returns response', async () => {
      const app = ProcessFlow();
      const processId = ProcessIdStub();

      const response = await app.request(`/api/process/${processId}/output`);
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(typeof body).toBe('object');
      expect(body).not.toBeNull();
    });
  });
});
