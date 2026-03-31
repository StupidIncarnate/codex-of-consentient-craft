import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { serverAppHarness } from '../../../test/harnesses/server-app/server-app.harness';

import { ProcessFlow } from './process-flow';

describe('ProcessFlow', () => {
  const harness = serverAppHarness();

  describe('GET /api/process/:processId', () => {
    it('VALID: {processId} => delegates to ProcessStatusResponder and returns response', async () => {
      const app = ProcessFlow();
      const processId = ProcessIdStub();

      const response = await app.request(`/api/process/${processId}`);
      const body: unknown = await response.json();

      expect(response.status).toBe(500);
      expect(harness.toPlain(body)).toStrictEqual({ error: 'Process not found: proc-12345' });
    });
  });

  describe('GET /api/process/:processId/output', () => {
    it('VALID: {processId} => delegates to ProcessOutputResponder and returns response', async () => {
      const app = ProcessFlow();
      const processId = ProcessIdStub();

      const response = await app.request(`/api/process/${processId}/output`);
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(harness.toPlain(body)).toStrictEqual({ slots: {} });
    });
  });
});
