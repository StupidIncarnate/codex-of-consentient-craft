import { StartEndpointMock } from './start-endpoint-mock';

const BASE = 'http://localhost';

describe('StartEndpointMock', () => {
  describe('wiring to flow', () => {
    it('VALID: {method, url} => delegates to EndpointMockFlow and returns EndpointControl', () => {
      const control = StartEndpointMock.listen({ method: 'get', url: `${BASE}/test/startup` });

      expect(control).toStrictEqual({
        resolves: expect.any(Function),
        responds: expect.any(Function),
        respondRaw: expect.any(Function),
        networkError: expect.any(Function),
        getRequestCount: expect.any(Function),
      });
    });
  });
});
