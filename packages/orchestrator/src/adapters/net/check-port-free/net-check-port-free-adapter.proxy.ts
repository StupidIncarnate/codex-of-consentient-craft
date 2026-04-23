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
    setupPortFree: (): void => {
      handle.mockReturnValue(
        createMockServer({ listeningFires: true, errorFires: false }) as never,
      );
    },
    setupPortInUse: (): void => {
      handle.mockReturnValue(
        createMockServer({ listeningFires: false, errorFires: true }) as never,
      );
    },
  };
};
