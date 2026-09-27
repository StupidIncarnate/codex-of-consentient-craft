import { EndpointMockSetupResponderProxy } from './endpoint-mock-setup-responder.proxy';
import { EndpointMockSetupResponder } from './endpoint-mock-setup-responder';

describe('EndpointMockSetupResponder', () => {
  describe('lifecycle creation', () => {
    it('VALID: {no args} => returns object with listen, resetHandlers, close, assertNoUnhandledRequests methods', () => {
      EndpointMockSetupResponderProxy();

      const lifecycle = EndpointMockSetupResponder();

      expect(lifecycle).toStrictEqual({
        listen: expect.any(Function),
        resetHandlers: expect.any(Function),
        close: expect.any(Function),
        assertNoUnhandledRequests: expect.any(Function),
      });
    });

    // Never `listen()` or `close()` here: `packages/testing/jest.config.js` wires
    // `start-endpoint-mock-setup.ts` into every test file in this package, so the real MSW server
    // is ALREADY listening (via a SEPARATE `EndpointMockSetupResponder()` instance that setup file
    // owns) for the whole file. Calling `.listen()` again would re-apply the WebSocket interceptor
    // on top of an already-active one, and `.close()` would tear down the state every OTHER test in
    // this file depends on. The responder's actual unhandled-request/unhandled-connection behavior
    // is proven against a real, single-listener server instead (this file's own item notes name
    // where).
    it('VALID: {resetHandlers, assertNoUnhandledRequests called} => delegates without errors', () => {
      EndpointMockSetupResponderProxy();

      const lifecycle = EndpointMockSetupResponder();

      lifecycle.resetHandlers();
      lifecycle.assertNoUnhandledRequests();

      expect(lifecycle).toStrictEqual({
        listen: expect.any(Function),
        resetHandlers: expect.any(Function),
        close: expect.any(Function),
        assertNoUnhandledRequests: expect.any(Function),
      });
    });
  });
});
