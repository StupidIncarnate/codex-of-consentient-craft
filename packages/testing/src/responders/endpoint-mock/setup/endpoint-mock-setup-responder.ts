/**
 * PURPOSE: Creates the MSW server instance and returns lifecycle methods for test hook
 * registration. `onUnhandledRequest` is a callback rather than the bare 'error' string, and one
 * `ws` handler matches every WebSocket URL, because both need to RECORD what they caught before
 * failing it: code under test that catches the resulting rejection would otherwise swallow it
 * silently, and `assertNoUnhandledRequests` reads the recording back independently of that catch.
 * An integration or e2e test does real I/O against a server it started itself by design (T8's own
 * "Integration Test (real dependencies)" row), so `testPath` gates the whole thing: for one of
 * those files this returns a no-op lifecycle instead, the same carve-out
 * `jest.setup-io-trap.js` already makes for the unit-test I/O trap.
 *
 * USAGE:
 * const lifecycle = EndpointMockSetupResponder({ testPath: expect.getState().testPath });
 * // Returns { listen, resetHandlers, close, assertNoUnhandledRequests } for use in jest hooks
 */

import type { EndpointMockLifecycle } from '../../../contracts/endpoint-mock-lifecycle/endpoint-mock-lifecycle-contract';
import { ws } from '#gateway/npm/msw';
import { mswServerState } from '../../../state/msw-server/msw-server-state';
import { isRealIoTestFileGuard } from '../../../guards/is-real-io-test-file/is-real-io-test-file-guard';
import { endpointMockLifecycleContract } from '../../../contracts/endpoint-mock-lifecycle/endpoint-mock-lifecycle-contract';

// RFC 6455 reserves 1000-1015 for the protocol itself; 1011 ("internal error") is what
// `@mswjs/interceptors` itself closes with on an uncaught connection-handling exception — reused
// here for the analogous "nothing staged this connection" case.
const UNHANDLED_WS_CLOSE_CODE = 1011;
const UNHANDLED_WS_REASON = 'MSW: no test handler staged this WebSocket connection';

const NOOP_LIFECYCLE: EndpointMockLifecycle = endpointMockLifecycleContract.parse({
  listen: (): void => undefined,
  resetHandlers: (): void => undefined,
  close: (): void => undefined,
  assertNoUnhandledRequests: (): void => undefined,
});

export const EndpointMockSetupResponder = ({
  testPath,
}: { testPath?: string } = {}): EndpointMockLifecycle => {
  // `exactOptionalPropertyTypes` refuses `{ testPath: undefined }` for the guard's optional key —
  // OMIT it when unset, never assign it `undefined`.
  if (isRealIoTestFileGuard(testPath === undefined ? {} : { testPath })) {
    return NOOP_LIFECYCLE;
  }

  const server = mswServerState.get();
  const unhandled: string[] = [];

  // `*` matches every URL. Passed to `resetHandlers()` (never `use()`) both here and below, so a
  // per-test `resetHandlers()` call — which replaces the WHOLE handler list, discarding anything
  // `use()` added — always re-applies it rather than leaving the next test's WebSocket connections
  // to fall through to `handlers.length === 0` and connect for real.
  const catchAllWsHandler = ws.link('*').addEventListener('connection', ({ client }) => {
    unhandled.push(`WS ${client.url.toString()}`);
    // `close()` alone is enough: the interceptor only auto-dispatches 'open' when the client
    // socket is STILL `CONNECTING` once every "connection" listener has run, so closing here (via
    // `WebSocketClientConnectionProtocol`'s own public `close`, no `.socket` reach-through needed)
    // pre-empts that and the app-level socket sees 'close' instead.
    client.close(UNHANDLED_WS_CLOSE_CODE, UNHANDLED_WS_REASON);
  });

  return endpointMockLifecycleContract.parse({
    listen: (): void => {
      server.resetHandlers(catchAllWsHandler);
      server.listen({
        onUnhandledRequest: (request, print): void => {
          unhandled.push(`${request.method} ${request.url}`);
          // `print.error()` is what makes MSW reject the caller's own `fetch()` — recording it
          // above is what lets `assertNoUnhandledRequests` still fail the test when the caller's
          // own code catches that rejection.
          print.error();
        },
      });
    },
    resetHandlers: (): void => {
      server.resetHandlers(catchAllWsHandler);
    },
    close: (): void => {
      server.close();
    },
    assertNoUnhandledRequests: (): void => {
      const found = unhandled.splice(0);
      if (found.length > 0) {
        throw new Error(
          `Test made a request or WebSocket connection that nothing staged:\n  ${found.join('\n  ')}`,
        );
      }
    },
  });
};
