import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { ProcessFlow } from './process-flow';

describe('ProcessFlow', () => {
  describe('GET /api/process/:processId', () => {
    it('VALID: {processId} => delegates to ProcessStatusResponder and returns response', async () => {
      const app = ProcessFlow();
      const processId = ProcessIdStub();

      const response = await app.request(`/api/process/${processId}`);
      const body: unknown = await response.json();

      expect(body).toStrictEqual(expect.any(Object));
    });
  });

  describe('GET /api/process/:processId/output', () => {
    it('VALID: {processId} => delegates to ProcessOutputResponder and returns response', async () => {
      const app = ProcessFlow();
      const processId = ProcessIdStub();

      const response = await app.request(`/api/process/${processId}/output`);
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(body).toStrictEqual(expect.any(Object));
    });
  });
});
