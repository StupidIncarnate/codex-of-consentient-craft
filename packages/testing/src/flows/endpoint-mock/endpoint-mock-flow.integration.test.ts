import { EndpointMockFlow } from './endpoint-mock-flow';

const BASE = 'http://localhost';

describe('EndpointMockFlow', () => {
  describe('listen returns EndpointControl', () => {
    it('VALID: {method, url} => returns object with resolves, responds, respondRaw, networkError methods', () => {
      const control = EndpointMockFlow.listen({ method: 'get', url: `${BASE}/test/smoke` });

      expect(typeof control.resolves).toBe('function');
      expect(typeof control.responds).toBe('function');
      expect(typeof control.respondRaw).toBe('function');
      expect(typeof control.networkError).toBe('function');
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
