import { createServer, Server, Socket } from 'net';
import { dirname } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type ConnectionHandler = (socket: Socket) => void;

// `createServer(handler)` takes only the wrapper's own connection closure, so it carries nothing a
// test chose; the address a test knows is the socketPath `listen` receives. Each stage therefore
// arms `createServer` with a server whose `listen` looks its path up among the staged paths — an
// unstaged path goes to the real `listen` — and the three `fs` calls the wrapper makes before binding
// are staged by that same exact path. The server is a REAL `net.Server` with only `listen` and
// `close` replaced, so the wrapper's `.on('error')` runs as Node wrote it.
export const unixSocketServeProxy = (): {
  // Binds a fresh path: no socket file there yet.
  listens: (params: { socketPath: string }) => void;
  // Binds over a socket file a dead peer left behind, which the wrapper unlinks first.
  listensOverStaleSocket: (params: { socketPath: string }) => void;
  // The bind fails with `error` — pass a recorded one (`UnixSocketRecordedErrorStub`, EADDRINUSE).
  listenFails: (params: { socketPath: string; error: NodeJS.ErrnoException }) => void;
  // Opens one client connection to the server bound on this path and returns what it can do.
  connectClient: (params: { socketPath: string }) => {
    sendLine: (params: { line: string }) => void;
    // Every line the server wrote back on this connection, newline stripped, in order.
    getWrittenLines: () => readonly string[];
  };
  getCloseCountFor: (params: { socketPath: string }) => number;
  // Every `mkdirSync` call for this socket's parent directory, as full argument tuples.
  getMkdirCallsFor: (params: { socketPath: string }) => readonly unknown[][];
  // Every `unlinkSync` call for this socket path, as full argument tuples.
  getUnlinkCallsFor: (params: { socketPath: string }) => readonly unknown[][];
} => {
  const mkdirHandle = registerMock({ fn: mkdirSync });
  const existsHandle = registerMock({ fn: existsSync });
  const unlinkHandle = registerMock({ fn: unlinkSync });
  const serverHandle = registerMock({ fn: createServer });

  const listenErrorByPath = new Map<string, NodeJS.ErrnoException | null>();
  const handlerByPath = new Map<string, ConnectionHandler>();
  const closeCountByPath = new Map<string, number>();

  const armCreateServer = (): void => {
    serverHandle.calledWith([]).implement((handler: ConnectionHandler) => {
      const server = new Server();
      const realListen = server.listen.bind(server);
      const bound = { path: '' };

      server.listen = ((path: string, onListening: () => void): Server => {
        const error = listenErrorByPath.get(path);
        // An unstaged path reaches the real `listen`, which a composing package's unit run traps
        // and reports by path — the loud failure, without a made-up error standing in for it.
        if (error === undefined) {
          return realListen(path, onListening);
        }
        bound.path = path;
        process.nextTick(() => {
          if (error === null) {
            handlerByPath.set(path, handler);
            onListening();
            return;
          }
          server.emit('error', error);
        });
        return server;
      }) as Server['listen'];

      server.close = ((onClosed: () => void): Server => {
        closeCountByPath.set(bound.path, (closeCountByPath.get(bound.path) ?? 0) + 1);
        process.nextTick(onClosed);
        return server;
      }) as Server['close'];

      return server;
    });
  };

  const stageBind = ({
    socketPath,
    stale,
    error,
  }: {
    socketPath: string;
    stale: boolean;
    error: NodeJS.ErrnoException | null;
  }): void => {
    mkdirHandle.calledWith([dirname(socketPath)]).returns(undefined);
    existsHandle.calledWith([socketPath]).returns(stale);
    if (stale) {
      unlinkHandle.calledWith([socketPath]).returns(undefined);
    }
    listenErrorByPath.set(socketPath, error);
    armCreateServer();
  };

  return {
    listens: ({ socketPath }: { socketPath: string }): void => {
      stageBind({ socketPath, stale: false, error: null });
    },

    listensOverStaleSocket: ({ socketPath }: { socketPath: string }): void => {
      stageBind({ socketPath, stale: true, error: null });
    },

    listenFails: ({
      socketPath,
      error,
    }: {
      socketPath: string;
      error: NodeJS.ErrnoException;
    }): void => {
      stageBind({ socketPath, stale: false, error });
    },

    connectClient: ({
      socketPath,
    }: {
      socketPath: string;
    }): {
      sendLine: (params: { line: string }) => void;
      getWrittenLines: () => readonly string[];
    } => {
      const handler = handlerByPath.get(socketPath);
      if (handler === undefined) {
        throw new Error(`unixSocketServeProxy: nothing is listening on ${socketPath}`);
      }
      const writtenLines: string[] = [];
      // A REAL `net.Socket` that never connects; the wrapper answers through `end(line)`, so only
      // `end` is replaced, recording the line a real peer would read.
      const socket = new Socket();
      socket.end = ((chunk: unknown): Socket => {
        writtenLines.push(String(chunk).replace(/\n$/u, ''));
        return socket;
      }) as Socket['end'];
      handler(socket);

      return {
        sendLine: ({ line }: { line: string }): void => {
          socket.emit('data', Buffer.from(`${line}\n`));
        },
        getWrittenLines: (): readonly string[] => writtenLines,
      };
    },

    getCloseCountFor: ({ socketPath }: { socketPath: string }): number =>
      closeCountByPath.get(socketPath) ?? 0,

    getMkdirCallsFor: ({ socketPath }: { socketPath: string }): readonly unknown[][] =>
      mkdirHandle.callsMatching([dirname(socketPath)]),

    getUnlinkCallsFor: ({ socketPath }: { socketPath: string }): readonly unknown[][] =>
      unlinkHandle.callsMatching([socketPath]),
  };
};
