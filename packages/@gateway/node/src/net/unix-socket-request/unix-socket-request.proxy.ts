import { createConnection, Socket } from 'net';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// `unixSocketRequest` calls `createConnection({ path: socketPath })`, so every stage is addressed
// by that exact `{ path }` — a test's own socketPath — and a socket nobody staged throws. Each stage
// answers with a REAL `net.Socket` that never connects: the wrapper's `.on`, `.removeAllListeners`
// and `.destroy` run as Node wrote them, and only `write` is replaced, because the request line it
// carries is what a test reads back and what triggers the staged answer. Events are emitted on the
// next tick, after the wrapper has attached its listeners, the order a real connection keeps.
const createStagedSocket = ({
  onRequestLine,
}: {
  onRequestLine: (params: { socket: Socket; requestLine: string }) => void;
}): Socket => {
  const socket = new Socket();

  socket.write = ((chunk: unknown): boolean => {
    const requestLine = String(chunk).replace(/\n$/u, '');
    onRequestLine({ socket, requestLine });
    return true;
  }) as Socket['write'];

  return socket;
};

export const unixSocketRequestProxy = (): {
  // Connects, then answers the request line with `line` plus the newline that ends a frame.
  respondsWith: (params: { socketPath: string; line: string }) => void;
  // Fails the connection with `error` — pass a recorded one (`UnixSocketRecordedErrorStub`).
  rejects: (params: { socketPath: string; error: NodeJS.ErrnoException }) => void;
  // Connects and takes the request line, but never answers — only the wrapper's own timer settles it.
  neverResponds: (params: { socketPath: string }) => void;
  // Every request line written to this socket, newline stripped, in call order.
  getRequestLinesFor: (params: { socketPath: string }) => readonly string[];
  // How many connections were opened to this socket, answered or not.
  getConnectionCountFor: (params: { socketPath: string }) => number;
} => {
  const handle = registerMock({ fn: createConnection });
  const requestLinesByPath = new Map<string, string[]>();

  const recordRequestLine = ({
    socketPath,
    requestLine,
  }: {
    socketPath: string;
    requestLine: string;
  }): void => {
    requestLinesByPath.set(socketPath, [
      ...(requestLinesByPath.get(socketPath) ?? []),
      requestLine,
    ]);
  };

  return {
    respondsWith: ({ socketPath, line }: { socketPath: string; line: string }): void => {
      handle.calledWith([{ path: socketPath }]).implement(() => {
        const socket = createStagedSocket({
          onRequestLine: ({ socket: answering, requestLine }) => {
            recordRequestLine({ socketPath, requestLine });
            process.nextTick(() => {
              answering.emit('data', Buffer.from(`${line}\n`));
            });
          },
        });
        process.nextTick(() => {
          socket.emit('connect');
        });
        return socket;
      });
    },

    rejects: ({
      socketPath,
      error,
    }: {
      socketPath: string;
      error: NodeJS.ErrnoException;
    }): void => {
      handle.calledWith([{ path: socketPath }]).implement(() => {
        const socket = createStagedSocket({
          onRequestLine: ({ requestLine }) => {
            recordRequestLine({ socketPath, requestLine });
          },
        });
        process.nextTick(() => {
          socket.emit('error', error);
        });
        return socket;
      });
    },

    neverResponds: ({ socketPath }: { socketPath: string }): void => {
      handle.calledWith([{ path: socketPath }]).implement(() => {
        const socket = createStagedSocket({
          onRequestLine: ({ requestLine }) => {
            recordRequestLine({ socketPath, requestLine });
          },
        });
        process.nextTick(() => {
          socket.emit('connect');
        });
        return socket;
      });
    },

    getRequestLinesFor: ({ socketPath }: { socketPath: string }): readonly string[] =>
      requestLinesByPath.get(socketPath) ?? [],

    getConnectionCountFor: ({ socketPath }: { socketPath: string }): number =>
      handle.callsMatching([{ path: socketPath }]).length,
  };
};
