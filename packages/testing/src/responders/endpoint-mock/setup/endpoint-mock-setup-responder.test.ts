import { EndpointMockSetupResponderProxy } from './endpoint-mock-setup-responder.proxy';
import { EndpointMockSetupResponder } from './endpoint-mock-setup-responder';

describe('EndpointMockSetupResponder', () => {
  describe('lifecycle creation', () => {
    it('VALID: {no args} => returns object with listen, resetHandlers, close methods', () => {
      EndpointMockSetupResponderProxy();

      const lifecycle = EndpointMockSetupResponder();

      expect(lifecycle).toStrictEqual({
        listen: expect.any(Function),
        resetHandlers: expect.any(Function),
        close: expect.any(Function),
      });
    });

    it('VALID: {lifecycle methods called} => delegates to server without errors', () => {
      EndpointMockSetupResponderProxy();

      const lifecycle = EndpointMockSetupResponder();

      lifecycle.listen();
      lifecycle.resetHandlers();
      lifecycle.close();

      expect(lifecycle).toStrictEqual({
        listen: expect.any(Function),
        resetHandlers: expect.any(Function),
        close: expect.any(Function),
      });
    });
  });
});
