import { createServer, type Server, type Socket } from 'net';
import { existsSync, unlinkSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

type ConnectionHandler = (socket: Socket) => void;
type DataCallback = (chunk: Buffer) => void;
type ErrorCallback = (error: Error) => void;
type ListenCallback = () => void;
type ListenOutcome = { succeeds: true } | { succeeds: false; error: Error };

export const netUnixServeAdapterProxy = (): {
  setupFreshSocket: () => void;
  setupStaleSocket: (params: { socketPath: AbsoluteFilePath }) => void;
  listenFails: (params: { error: Error }) => void;
  getListenedPath: () => unknown;
  getUnlinkedPaths: () => unknown[];
  connectClient: () => {
    sendFrame: (params: { frame: string }) => void;
    getWrites: () => unknown[];
  };
} => {
  const existsHandle = registerMock({ fn: existsSync });
  const unlinkHandle = registerMock({ fn: unlinkSync });
  const serverHandle = registerMock({ fn: createServer });

  // No stale socket file by default — most tests bind a fresh path.
  existsHandle.calledWith([]).returns(false);
  unlinkHandle.calledWith([]).returns(undefined);

  const listenOutcomeRef: { current: ListenOutcome } = { current: { succeeds: true } };
  const connectionHandlerRef: { current: ConnectionHandler | null } = { current: null };
  const listenPathRef: { current: unknown } = { current: undefined };
  const errorListeners: ErrorCallback[] = [];

  serverHandle.calledWith([]).implement((connectionHandler: ConnectionHandler) => {
    connectionHandlerRef.current = connectionHandler;

    const server = {
      on: (event: string, callback: ErrorCallback): unknown => {
        if (event === 'error') {
          errorListeners.push(callback);
        }
        return undefined;
      },
      listen: (path: unknown, callback: ListenCallback): unknown => {
        listenPathRef.current = path;
        process.nextTick(() => {
          const outcome = listenOutcomeRef.current;
          if (outcome.succeeds) {
            callback();
            return;
          }
          for (const cb of errorListeners) {
            cb(outcome.error);
          }
        });
        return undefined;
      },
    } as unknown as Server;

    return server;
  });

  return {
    setupFreshSocket: (): void => {
      existsHandle.calledWith([]).returns(false);
    },

    setupStaleSocket: ({ socketPath }: { socketPath: AbsoluteFilePath }): void => {
      existsHandle.calledWith([socketPath]).returns(true);
      unlinkHandle.calledWith([socketPath]).returns(undefined);
    },

    listenFails: ({ error }: { error: Error }): void => {
      listenOutcomeRef.current = { succeeds: false, error };
    },

    getListenedPath: (): unknown => listenPathRef.current,

    getUnlinkedPaths: (): unknown[] => unlinkHandle.callsMatching([]).map((call) => call[0]),

    // Simulates a client connecting — fires the connection handler `createServer` was given, and
    // returns semantic methods scoped to that one connection's socket.
    connectClient: (): {
      sendFrame: (params: { frame: string }) => void;
      getWrites: () => unknown[];
    } => {
      const writes: unknown[] = [];
      const dataListeners: DataCallback[] = [];
      const socket = {
        on: (event: string, callback: DataCallback): unknown => {
          if (event === 'data') {
            dataListeners.push(callback);
          }
          return undefined;
        },
        write: (chunk: unknown): boolean => {
          writes.push(chunk);
          return true;
        },
      } as unknown as Socket;

      if (connectionHandlerRef.current !== null) {
        connectionHandlerRef.current(socket);
      }

      return {
        sendFrame: ({ frame }: { frame: string }): void => {
          for (const cb of dataListeners) {
            cb(Buffer.from(frame));
          }
        },
        getWrites: (): unknown[] => writes,
      };
    },
  };
};
