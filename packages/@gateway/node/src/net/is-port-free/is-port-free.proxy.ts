import { createServer, type Server } from 'net';
import { EventEmitter } from 'events';
import { registerMock } from '@dungeonmaster/testing/register-mock';

interface StagedPort {
  port: number;
  free: boolean;
}

type PortMatcher = number | ((value: unknown) => boolean);

// Built on a real EventEmitter (a single `as`, never `as unknown as`) so the `once('error')` and
// `once('listening')` listeners the wrapper attaches keep working, and only `listen` and `close`
// need a fake implementation. `listen(port)` answers from the staged data, so no socket is ever
// bound. A port nothing staged throws: answering `false` or `true` for it would let a caller pass
// against a port the test never described.
const createMockServer = ({
  stagedPorts,
  recordedCalls,
}: {
  stagedPorts: readonly StagedPort[];
  recordedCalls: unknown[][];
}): Server => {
  const server = new EventEmitter() as Server;

  server.listen = ((port: number): Server => {
    recordedCalls.push([port]);
    const staged = stagedPorts.filter((entry) => entry.port === port).at(-1);
    if (staged === undefined) {
      throw new Error(`isPortFreeProxy: port ${String(port)} was not staged`);
    }
    if (staged.free) {
      server.emit('listening');
    } else {
      server.emit('error', new Error(`listen EADDRINUSE: address already in use :::${port}`));
    }
    return server;
  }) as Server['listen'];

  server.close = ((callback?: () => void): Server => {
    callback?.();
    return server;
  }) as Server['close'];

  return server;
};

export const isPortFreeProxy = (): {
  setupPortFree: (params: { port: number }) => void;
  setupPortInUse: (params: { port: number }) => void;
  // Every `server.listen()` call's full argument tuple, in call order.
  getCalls: () => readonly unknown[][];
  // Every `server.listen()` call for this port (or matching predicate), in call order.
  getCallsFor: (params: { port: PortMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: createServer });
  const stagedPorts: StagedPort[] = [];
  const recordedCalls: unknown[][] = [];

  // `createServer()` takes no arguments, so the port a probe asks about only arrives later, at
  // `listen(port)`; the staged results are held as data and read there. The latest staging of a
  // port wins.
  handle.calledWith([]).implement((): Server => createMockServer({ stagedPorts, recordedCalls }));

  return {
    setupPortFree: ({ port }: { port: number }): void => {
      stagedPorts.push({ port, free: true });
    },
    setupPortInUse: ({ port }: { port: number }): void => {
      stagedPorts.push({ port, free: false });
    },
    getCalls: (): readonly unknown[][] => [...recordedCalls],
    getCallsFor: ({ port }: { port: PortMatcher }): readonly unknown[][] =>
      recordedCalls.filter(([calledPort]) =>
        typeof port === 'function' ? port(calledPort) : calledPort === port,
      ),
  };
};
