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

  // An integration or e2e test does real I/O against a server it starts itself — see this
  // responder's own PURPOSE header. These cases never touch `.listen()`'s real effect (the no-op
  // branch never calls `mswServerAdapter`/`mswWsAdapter` at all), so they are safe to call every
  // method on directly, unlike the real-branch cases above.
  describe('a real-I/O test file (integration or e2e)', () => {
    it('VALID: {testPath: an integration test file} => every lifecycle method is a callable no-op', () => {
      EndpointMockSetupResponderProxy();

      const lifecycle = EndpointMockSetupResponder({
        testPath: '/repo/packages/x/src/y.integration.test.ts',
      });

      lifecycle.listen();
      lifecycle.resetHandlers();
      lifecycle.assertNoUnhandledRequests();
      lifecycle.close();

      expect(lifecycle).toStrictEqual({
        listen: expect.any(Function),
        resetHandlers: expect.any(Function),
        close: expect.any(Function),
        assertNoUnhandledRequests: expect.any(Function),
      });
    });

    it('VALID: {testPath: two different real-I/O test files} => both return the identical no-op lifecycle', () => {
      EndpointMockSetupResponderProxy();
      const first = EndpointMockSetupResponder({ testPath: 'a.integration.test.ts' });

      EndpointMockSetupResponderProxy();
      const second = EndpointMockSetupResponder({ testPath: 'b.e2e.ts' });

      expect(first).toBe(second);
    });
  });
});
