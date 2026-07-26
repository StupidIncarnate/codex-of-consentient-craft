import { createServer, type Server } from 'net';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { NetworkPortStub, type NetworkPort } from '@dungeonmaster/shared/contracts';

export const netFreePortAdapterProxy = (): {
  setupPort: (params: { port: number }) => void;
  setupError: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: createServer });

  // Mutable via object fields (not let/var) so setupPort/setupError can override behavior
  // before the adapter under test invokes the server's callbacks.
  const state: { port: NetworkPort; error: Error | null } = {
    port: NetworkPortStub(),
    error: null,
  };

  const mockServer = {
    listen: (_port: number, callback: () => void): void => {
      if (state.error === null) {
        callback();
      }
    },
    close: (callback: () => void): void => {
      callback();
    },
    address: (): { port: NetworkPort } => ({ port: state.port }),
    on: (event: string, handler: (err: Error) => void): unknown => {
      if (event === 'error' && state.error !== null) {
        handler(state.error);
      }
      return mockServer;
    },
  } as unknown as Server;

  // net.createServer() is called with zero arguments in netFreePortAdapter — there is no
  // identifying argument to key on, so `[]` is the honest description, not a lazy catch-all.
  handle.calledWith([]).returns(mockServer);

  return {
    setupPort: ({ port }: { port: number }): void => {
      state.port = NetworkPortStub({ value: port });
    },
    setupError: ({ error }: { error: Error }): void => {
      state.error = error;
    },
  };
};
