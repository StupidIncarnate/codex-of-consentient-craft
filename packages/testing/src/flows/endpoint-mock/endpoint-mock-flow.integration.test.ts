import { EndpointMockFlow } from './endpoint-mock-flow';

const BASE = 'http://localhost';

describe('EndpointMockFlow', () => {
  describe('listen returns EndpointControl', () => {
    it('VALID: {method, url} => returns object with resolves, responds, respondRaw, networkError methods', () => {
      const control = EndpointMockFlow.listen({ method: 'get', url: `${BASE}/test/smoke` });

      expect(control).toStrictEqual({
        resolves: expect.any(Function),
        responds: expect.any(Function),
        respondRaw: expect.any(Function),
        networkError: expect.any(Function),
        getRequestCount: expect.any(Function),
      });
    });
  });

  describe('wiring to responder', () => {
    it('VALID: {resolves with data} => mock intercepts fetch and returns configured response', async () => {
      const endpoint = EndpointMockFlow.listen({ method: 'get', url: `${BASE}/test/wiring` });

      endpoint.resolves({ data: { wired: true } });

      const response = await fetch(`${BASE}/test/wiring`);
      const body = JSON.parse(JSON.stringify(await response.json())) as unknown;

      expect(body).toStrictEqual({ wired: true });
    });
  });
});
