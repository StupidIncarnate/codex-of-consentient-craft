import { createServer, type Server } from 'net';
import { EventEmitter } from 'events';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

// Built on a real EventEmitter (a single `as`, never `as unknown as`) rather than a hand-rolled
// object literal — `Server` extends `EventEmitter`, so the real `.on()`/`.emit()` a caller attaches
// an `'error'` listener through keep working, and only the three methods `freePortPair` actually
// calls (`listen`, `address`, `close`) need a fake implementation assigned afterward, the same shape
// `run.proxy.ts` uses for `ChildProcess.kill`.
const createMockServer = ({ getPort }: { getPort: () => number }): Server => {
  const server = new EventEmitter() as Server;

  server.listen = ((_port: number, callback?: () => void): Server => {
    callback?.();
    return server;
  }) as Server['listen'];

  server.address = ((): { port: number } => ({ port: getPort() })) as Server['address'];

  server.close = ((callback?: () => void): Server => {
    callback?.();
    return server;
  }) as Server['close'];

  return server;
};

export const freePortPairProxy = (): {
  returns: (params: { server: number; web: number }) => void;
  // Each `freePortPair()` call answers the NEXT pair, in order. A call past the last staged pair
  // finds no queued answer, so registerMock's unstaged-call throw fires and the call rejects.
  returnsSequence: (params: { pairs: readonly { server: number; web: number }[] }) => void;
  // Every `createServer()` call's full argument tuple, in call order — two per `freePortPair()`.
  getCalls: () => RecordedCalls;
} => {
  const handle = registerMock({ fn: createServer });

  return {
    // One queued answer per `createServer()` call (server then web, per pair), consumed in order.
    returnsSequence: ({ pairs }: { pairs: readonly { server: number; web: number }[] }): void => {
      pairs.forEach(({ server, web }) => {
        [server, web].forEach((port) => {
          handle.onceFor([]).implement((): Server => createMockServer({ getPort: () => port }));
        });
      });
    },

    getCalls: (): RecordedCalls => handle.callsMatching([]),

    // `createServer()` takes zero arguments, called TWICE per `freePortPair()` invocation — there
    // is no identifying argument to key the two calls apart on, so `[]` is the honest address, not
    // a lazy catch-all. The wrapper builds `first` THEN `second`, both synchronously, before either
    // one ever calls `.listen()` or `.address()` — so the port each mock server hands back must be
    // FROZEN at `createServer()` call time (a `const` read once per `implement` invocation), never
    // read lazily off shared state when `.address()` fires later: by then both calls have already
    // happened and a lazily-read counter would answer "second" for both.
    returns: ({ server, web }: { server: number; web: number }): void => {
      const state = { served: 0 };
      handle.calledWith([]).implement((): Server => {
        state.served += 1;
        const port = state.served === 1 ? server : web;
        return createMockServer({ getPort: () => port });
      });
    },
  };
};
