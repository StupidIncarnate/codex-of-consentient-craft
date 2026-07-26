import { createServer } from 'net';
import { registerMock } from '@dungeonmaster/testing/register-mock';

interface MockServer {
  listen: jest.Mock;
  close: jest.Mock;
  once: jest.Mock;
}

export const netCheckPortFreeAdapterProxy = (): {
  setupPortFree: () => void;
  setupPortInUse: () => void;
} => {
  const handle = registerMock({ fn: createServer });

  const createMockServer = ({
    listeningFires,
    errorFires,
  }: {
    listeningFires: boolean;
    errorFires: boolean;
  }): MockServer => {
    const mockServer: MockServer = {
      listen: jest.fn(),
      close: jest.fn(),
      once: jest.fn(),
    };

    mockServer.once.mockImplementation((event: string, handler: () => void) => {
      if (event === 'listening' && listeningFires) {
        handler();
      }
      if (event === 'error' && errorFires) {
        handler();
      }
      return mockServer;
    });

    mockServer.close.mockImplementation((callback: () => void) => {
      callback();
    });

    mockServer.listen.mockReturnValue(mockServer);

    return mockServer;
  };

  return {
    // createServer() takes no arguments — the port is only used later via the fake server's
    // own `.listen(port)` call, not on this mocked function, so there is no real value here
    // to key on.
    setupPortFree: (): void => {
      handle.calledWith([]).returns(createMockServer({ listeningFires: true, errorFires: false }));
    },
    setupPortInUse: (): void => {
      handle.calledWith([]).returns(createMockServer({ listeningFires: false, errorFires: true }));
    },
  };
};
