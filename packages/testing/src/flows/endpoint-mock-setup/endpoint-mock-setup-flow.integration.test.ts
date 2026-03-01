import { EndpointMockSetupFlow } from './endpoint-mock-setup-flow';

describe('EndpointMockSetupFlow', () => {
  describe('delegation to responder', () => {
    it('VALID: {no args} => returns lifecycle object with listen, resetHandlers, close', () => {
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
