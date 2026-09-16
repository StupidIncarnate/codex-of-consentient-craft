import { createConnection, type Socket } from 'net';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import type { DriverResponse } from '../../../contracts/driver-response/driver-response-contract';

type VoidCallback = () => void;
type DataCallback = (chunk: Buffer) => void;
type ErrorCallback = (error: Error) => void;

const createMockSocket = (): {
  socket: Socket;
  listeners: { connect: VoidCallback[]; data: DataCallback[]; error: ErrorCallback[] };
  writes: unknown[];
} => {
  const listeners = {
    connect: [] as VoidCallback[],
    data: [] as DataCallback[],
    error: [] as ErrorCallback[],
  };
  const writes: unknown[] = [];

  const socket = {
    on: (event: string, callback: VoidCallback | DataCallback | ErrorCallback): unknown => {
      if (event === 'connect') {
        listeners.connect.push(callback as VoidCallback);
      }
      if (event === 'data') {
        listeners.data.push(callback as DataCallback);
      }
      if (event === 'error') {
        listeners.error.push(callback as ErrorCallback);
      }
      return undefined;
    },
    write: (chunk: unknown): boolean => {
      writes.push(chunk);
      return true;
    },
    removeAllListeners: (): unknown => undefined,
    destroy: (): unknown => undefined,
  } as unknown as Socket;

  return { socket, listeners, writes };
};

export const netUnixRequestAdapterProxy = (): {
  respondsWith: (params: { socketPath: AbsoluteFilePath; response: DriverResponse }) => void;
  respondsWithRawFrame: (params: { socketPath: AbsoluteFilePath; frame: string }) => void;
  connectFails: (params: { socketPath: AbsoluteFilePath; error: Error }) => void;
  neverResponds: (params: { socketPath: AbsoluteFilePath }) => void;
  getWrittenFor: (params: { socketPath: AbsoluteFilePath }) => unknown;
} => {
  const handle = registerMock({ fn: createConnection });
  const writesByPath = new Map<AbsoluteFilePath, unknown[]>();

  return {
    // Fires 'connect' then one 'data' frame carrying the JSON-encoded response on the next tick,
    // matching how a real driver answers after accepting the connection.
    respondsWith: ({
      socketPath,
      response,
    }: {
      socketPath: AbsoluteFilePath;
      response: DriverResponse;
    }): void => {
      handle.calledWith([{ path: socketPath }]).implement(() => {
        const { socket, listeners, writes } = createMockSocket();
        writesByPath.set(socketPath, writes);

        process.nextTick(() => {
          for (const cb of listeners.connect) {
            cb();
          }
          for (const cb of listeners.data) {
            cb(Buffer.from(`${JSON.stringify(response)}\n`));
          }
        });

        return socket;
      });
    },

    // Fires a raw newline-terminated frame verbatim — for malformed-JSON and malformed-shape cases.
    respondsWithRawFrame: ({
      socketPath,
      frame,
    }: {
      socketPath: AbsoluteFilePath;
      frame: string;
    }): void => {
      handle.calledWith([{ path: socketPath }]).implement(() => {
        const { socket, listeners, writes } = createMockSocket();
        writesByPath.set(socketPath, writes);

        process.nextTick(() => {
          for (const cb of listeners.connect) {
            cb();
          }
          for (const cb of listeners.data) {
            cb(Buffer.from(frame));
          }
        });

        return socket;
      });
    },

    // Fires the connection's own 'error' event — how a real ENOENT/ECONNREFUSED surfaces.
    connectFails: ({ socketPath, error }: { socketPath: AbsoluteFilePath; error: Error }): void => {
      handle.calledWith([{ path: socketPath }]).implement(() => {
        const { socket, listeners, writes } = createMockSocket();
        writesByPath.set(socketPath, writes);

        process.nextTick(() => {
          for (const cb of listeners.error) {
            cb(error);
          }
        });

        return socket;
      });
    },

    // Connects but never fires 'connect', 'data' or 'error' — the shape a hung driver leaves
    // behind, so only the adapter's own timer settles the request.
    neverResponds: ({ socketPath }: { socketPath: AbsoluteFilePath }): void => {
      handle.calledWith([{ path: socketPath }]).implement(() => {
        const { socket, writes } = createMockSocket();
        writesByPath.set(socketPath, writes);

        return socket;
      });
    },

    getWrittenFor: ({ socketPath }: { socketPath: AbsoluteFilePath }): unknown =>
      writesByPath.get(socketPath)?.at(-1),
  };
};
