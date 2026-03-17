import { createServer } from 'net';
import { NetworkPortStub } from '@dungeonmaster/shared/contracts';

jest.mock('net');

interface MockServer {
  listen: jest.Mock;
  close: jest.Mock;
  address: jest.Mock;
  on: jest.Mock;
}

export const netFreePortAdapterProxy = (): {
  setupPort: (params: { port: number }) => void;
  setupError: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(createServer);
  const defaultPort = NetworkPortStub();

  const mockServer: MockServer = {
    listen: jest.fn(),
    close: jest.fn(),
    address: jest.fn(),
    on: jest.fn().mockReturnThis(),
  };

  mockServer.listen.mockImplementation((_port: number, callback: () => void) => {
    callback();
  });
  mockServer.close.mockImplementation((callback: () => void) => {
    callback();
  });
  mockServer.address.mockReturnValue({ port: defaultPort });
  mock.mockReturnValue(mockServer as never);

  return {
    setupPort: ({ port }: { port: number }): void => {
      mockServer.address.mockReturnValueOnce({ port });
    },
    setupError: ({ error }: { error: Error }): void => {
      mockServer.listen.mockImplementation((_port: number, _callback: () => void) => {
        // Don't call success callback — error fires via on('error')
      });
      mockServer.on.mockImplementation((event: string, handler: (err: Error) => void) => {
        if (event === 'error') {
          handler(error);
        }
        return mockServer;
      });
    },
  };
};
