import { createInterface } from 'readline';
import { EventEmitter } from 'events';
import type { Interface as ReadlineInterface } from 'readline';

jest.mock('readline');

export const readlineCreateLineReaderAdapterProxy = (): {
  setupLineReader: () => {
    emitLine: (params: { line: string }) => void;
    emitClose: () => void;
  };
} => {
  const mockCreateInterface = jest.mocked(createInterface);

  mockCreateInterface.mockImplementation(
    (() => new EventEmitter()) as unknown as typeof createInterface,
  );

  return {
    setupLineReader: (): {
      emitLine: (params: { line: string }) => void;
      emitClose: () => void;
    } => {
      const emitter = new EventEmitter();

      mockCreateInterface.mockReturnValueOnce(emitter as unknown as ReadlineInterface);

      return {
        emitLine: ({ line }: { line: string }): void => {
          emitter.emit('line', line);
        },
        emitClose: (): void => {
          emitter.emit('close');
        },
      };
    },
  };
};
