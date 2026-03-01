import { StartEndpointMock } from './start-endpoint-mock';

const BASE = 'http://localhost';

describe('StartEndpointMock', () => {
  describe('wiring to flow', () => {
    it('VALID: {method, url} => delegates to EndpointMockFlow and returns EndpointControl', () => {
      const control = StartEndpointMock.listen({ method: 'get', url: `${BASE}/test/startup` });

      expect(typeof control.resolves).toBe('function');
      expect(typeof control.responds).toBe('function');
      expect(typeof control.respondRaw).toBe('function');
      expect(typeof control.networkError).toBe('function');
    });
  });
});
