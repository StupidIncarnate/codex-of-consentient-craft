/**
 * PURPOSE: Creates the MSW server instance and returns lifecycle methods for test hook
 * registration. `onUnhandledRequest` is a callback rather than the bare 'error' string, and one
 * `ws` handler matches every WebSocket URL, because both need to RECORD what they caught before
 * failing it: code under test that catches the resulting rejection would otherwise swallow it
 * silently, and `assertNoUnhandledRequests` reads the recording back independently of that catch.
 *
 * USAGE:
 * const lifecycle = EndpointMockSetupResponder();
 * // Returns { listen, resetHandlers, close, assertNoUnhandledRequests } for use in jest hooks
 */

import { unhandledRequestMessageContract } from '../../../contracts/unhandled-request-message/unhandled-request-message-contract';
import type { EndpointMockLifecycle } from '../../../contracts/endpoint-mock-lifecycle/endpoint-mock-lifecycle-contract';
import type { UnhandledRequestMessage } from '../../../contracts/unhandled-request-message/unhandled-request-message-contract';
import { mswServerAdapter } from '../../../adapters/msw/server/msw-server-adapter';
import { mswWsAdapter } from '../../../adapters/msw/ws/msw-ws-adapter';

// RFC 6455 reserves 1000-1015 for the protocol itself; 1011 ("internal error") is what
// `@mswjs/interceptors` itself closes with on an uncaught connection-handling exception — reused
// here for the analogous "nothing staged this connection" case.
const UNHANDLED_WS_CLOSE_CODE = 1011;
const UNHANDLED_WS_REASON = 'MSW: no test handler staged this WebSocket connection';

export const EndpointMockSetupResponder = (): EndpointMockLifecycle => {
  const server = mswServerAdapter();
  const { ws } = mswWsAdapter();
  const unhandled: UnhandledRequestMessage[] = [];

  // `*` matches every URL. Passed to `resetHandlers()` (never `use()`) both here and below, so a
  // per-test `resetHandlers()` call — which replaces the WHOLE handler list, discarding anything
  // `use()` added — always re-applies it rather than leaving the next test's WebSocket connections
  // to fall through to `handlers.length === 0` and connect for real.
  const catchAllWsHandler = ws.link('*').addEventListener('connection', ({ client }) => {
    unhandled.push(unhandledRequestMessageContract.parse(`WS ${client.url.toString()}`));
    // `close()` alone is enough: the interceptor only auto-dispatches 'open' when the client
    // socket is STILL `CONNECTING` once every "connection" listener has run, so closing here (via
    // `WebSocketClientConnectionProtocol`'s own public `close`, no `.socket` reach-through needed)
    // pre-empts that and the app-level socket sees 'close' instead.
    client.close(UNHANDLED_WS_CLOSE_CODE, UNHANDLED_WS_REASON);
  });

  return {
    listen: (): void => {
      server.resetHandlers(catchAllWsHandler);
      server.listen({
        onUnhandledRequest: (request, print): void => {
          unhandled.push(unhandledRequestMessageContract.parse(`${request.method} ${request.url}`));
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
  };
};
