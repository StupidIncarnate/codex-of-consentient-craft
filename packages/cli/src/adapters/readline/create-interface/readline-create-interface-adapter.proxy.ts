import type { StreamJsonLine } from '../../../contracts/stream-json-line/stream-json-line-contract';
import { createInterface, type Interface, type ReadLineOptions } from 'readline';
import { EventEmitter } from 'events';
import type { Readable } from 'stream';

jest.mock('readline');

export const readlineCreateInterfaceAdapterProxy = (): {
  getCreateInterfaceCalls: () => readonly Parameters<typeof createInterface>[];
  setupLines: (params: { lines: readonly StreamJsonLine[] }) => void;
  setupEmpty: () => void;
} => {
  const mockedCreateInterface = jest.mocked(createInterface);
  const lineQueue: StreamJsonLine[] = [];

  const createFakeInterface = (options: ReadLineOptions): Interface => {
    const fakeInterface = new EventEmitter() as Interface;
    fakeInterface.close = jest.fn();

    // Read from the actual input stream if provided and has .on method
    const inputStream = options.input as Readable | undefined;
    if (inputStream && typeof inputStream.on === 'function') {
      inputStream.on('data', (chunk: Buffer | string) => {
        const lines = chunk
          .toString()
          .split('\n')
          .filter((line) => line.length > 0);
        for (const line of lines) {
          fakeInterface.emit('line', line);
        }
      });
    } else {
      // Fall back to queued lines if no input stream
      setImmediate(() => {
        for (const line of lineQueue) {
          fakeInterface.emit('line', line);
        }
      });
    }

    return fakeInterface;
  };

  mockedCreateInterface.mockImplementation((options: ReadLineOptions) =>
    createFakeInterface(options),
  );

  return {
    getCreateInterfaceCalls: (): readonly Parameters<typeof createInterface>[] =>
      mockedCreateInterface.mock.calls,
    setupLines: ({ lines }: { lines: readonly StreamJsonLine[] }): void => {
      lineQueue.length = 0;
      lineQueue.push(...lines);
    },
    setupEmpty: (): void => {
      lineQueue.length = 0;
    },
  };
};
