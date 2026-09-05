import { createServer, type Server } from 'net';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { NetworkPortStub, type NetworkPort } from '@dungeonmaster/shared/contracts';

export const netFreePortPairAdapterProxy = (): {
  setupPorts: (params: { firstPort: number; secondPort: number }) => void;
  setupError: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: createServer });

  // Mutable via object fields (not let/var) so setupPorts/setupError can override behavior
  // before the adapter under test invokes the server's callbacks. `firstServed` is what tells
  // the two mock servers apart — the adapter builds `first` then `second`, in that order,
  // before either one listens.
  const state: {
    firstPort: NetworkPort;
    secondPort: NetworkPort;
    error: Error | null;
    firstServed: boolean;
  } = {
    firstPort: NetworkPortStub({ value: 40_000 }),
    secondPort: NetworkPortStub({ value: 40_001 }),
    error: null,
    firstServed: false,
  };

  // net.createServer() is called with zero arguments in netFreePortPairAdapter — there is no
  // identifying argument to key on, so `[]` is the honest description, not a lazy catch-all.
  // `implement` rather than `returns` because the two calls must hand back two DIFFERENT servers;
  // one shared object would report one port twice and hide the very collision this adapter exists
  // to prevent.
  handle.calledWith([]).implement((): Server => {
    const isFirst = !state.firstServed;
    state.firstServed = true;

    const mockServer = {
      listen: (_port: number, callback: () => void): void => {
        if (state.error === null) {
          callback();
        }
      },
      close: (callback: () => void): void => {
        callback();
      },
      address: (): { port: NetworkPort } => ({
        port: isFirst ? state.firstPort : state.secondPort,
      }),
      on: (event: string, handler: (err: Error) => void): unknown => {
        if (event === 'error' && state.error !== null) {
          handler(state.error);
        }
        return mockServer;
      },
    } as unknown as Server;

    return mockServer;
  });

  return {
    setupPorts: ({ firstPort, secondPort }: { firstPort: number; secondPort: number }): void => {
      state.firstPort = NetworkPortStub({ value: firstPort });
      state.secondPort = NetworkPortStub({ value: secondPort });
    },
    setupError: ({ error }: { error: Error }): void => {
      state.error = error;
    },
  };
};
