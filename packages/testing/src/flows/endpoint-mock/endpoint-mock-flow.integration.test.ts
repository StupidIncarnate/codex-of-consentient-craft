import { EndpointMockFlow } from './endpoint-mock-flow';
import { EndpointMockSetupResponder } from '../../responders/endpoint-mock/setup/endpoint-mock-setup-responder';

const BASE = 'http://localhost';

describe('EndpointMockFlow', () => {
  // This file's own path matches `.integration.test.ts`, so the GLOBAL setup
  // (`start-endpoint-mock-setup.ts`) hands it a no-op MSW lifecycle by design — an integration test
  // does real I/O against a server it started itself (`endpoint-mock-setup-responder.ts`'s own
  // header). What this suite proves is that `EndpointMockFlow.listen()` really does make MSW
  // intercept a real `fetch()`, so it starts an MSW server of its own here, independent of that
  // skipped global one: calling the setup responder with no `testPath` makes `isRealIoTestFileGuard`
  // read false and hands back the real (non-no-op) lifecycle.
  const lifecycle = EndpointMockSetupResponder();

  beforeAll(() => {
    lifecycle.listen();
  });

  afterEach(() => {
    lifecycle.resetHandlers();
    lifecycle.assertNoUnhandledRequests();
  });

  afterAll(() => {
    lifecycle.close();
  });

  describe('listen returns EndpointControl', () => {
    it('VALID: {method, url} => returns object with resolves, responds, respondRaw, networkError methods', () => {
      const control = EndpointMockFlow.listen({ method: 'get', url: `${BASE}/test/smoke` });

      expect(control).toStrictEqual({
        resolves: expect.any(Function),
        responds: expect.any(Function),
        respondRaw: expect.any(Function),
        networkError: expect.any(Function),
        holdsOpen: expect.any(Function),
        getRequestCount: expect.any(Function),
        getRequestBodies: expect.any(Function),
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

    it('VALID: {contract, resolves with data} => listen forwards contract to the responder, and the parsed value is served', async () => {
      // The contract is a plain object literal, not an import from a -contract.ts file: this is a
      // test file, and @dungeonmaster/ban-contract-in-tests bans a contract import here (including a
      // type-only one). `.parse` ignores its input and returns a fixed marker string, so the test
      // proves the FLOW forwarded `contract` through to the responder — un-forwarded, the served body
      // would be the raw staged data instead of this marker.
      const endpoint = EndpointMockFlow.listen({
        method: 'get',
        url: `${BASE}/test/contract-wiring`,
        contract: { parse: (): unknown => 'wired-via-contract' },
      });

      endpoint.resolves({ data: { wired: true } });

      const response = await fetch(`${BASE}/test/contract-wiring`);
      const body = JSON.parse(JSON.stringify(await response.json())) as unknown;

      expect(body).toBe('wired-via-contract');
    });
  });
});
