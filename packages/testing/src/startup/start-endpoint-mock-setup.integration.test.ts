import { EndpointMockSetupFlow } from '../flows/endpoint-mock-setup/endpoint-mock-setup-flow';

describe('StartEndpointMockSetup', () => {
  describe('lifecycle wiring', () => {
    it('VALID: {flow called} => returns lifecycle with listen, resetHandlers, close', () => {
      const lifecycle = EndpointMockSetupFlow();

      lifecycle.close();

      expect(lifecycle).toStrictEqual({
        listen: expect.any(Function),
        resetHandlers: expect.any(Function),
        close: expect.any(Function),
      });
    });
  });
});
