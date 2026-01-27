import { readlineCreateInterfaceAdapterProxy } from '../../../adapters/readline/create-interface/readline-create-interface-adapter.proxy';
import type { ExitCode } from '@dungeonmaster/shared/contracts';
import type { EventEmittingProcess } from '../../../contracts/event-emitting-process/event-emitting-process-contract';
import type { StreamJsonLine } from '../../../contracts/stream-json-line/stream-json-line-contract';
import { StreamTextStub } from '../../../contracts/stream-text/stream-text.stub';

type StreamText = ReturnType<typeof StreamTextStub>;
type Listeners = Record<PropertyKey, ((...args: unknown[]) => void)[]>;

const createMockProcess = ({
  listeners,
  exitCode,
}: {
  listeners: Listeners;
  exitCode: ExitCode | null;
}): EventEmittingProcess => ({
  kill: () => {
    setImmediate(() => {
      const exitListeners = listeners.exit;
      if (exitListeners) {
        for (const listener of exitListeners) {
          listener(exitCode);
        }
      }
    });
    return true;
  },
  on: (...args: unknown[]): unknown => {
    const [event, listener] = args as [PropertyKey, (...args: unknown[]) => void];
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(listener);
    return undefined;
  },
});

export const teeOutputLayerBrokerProxy = (): {
  setupStreamWithLines: (params: { lines: readonly StreamJsonLine[] }) => void;
  setupEmptyStream: () => void;
  returnsProcessWithExit: (params: { exitCode: ExitCode }) => EventEmittingProcess;
  returnsProcessWithNullExit: () => EventEmittingProcess;
  returnsProcessWithError: (params: { error: Error }) => EventEmittingProcess;
  getWrittenOutput: () => StreamText;
} => {
  const rlProxy = readlineCreateInterfaceAdapterProxy();

  // Capture written chunks via spy
  const writtenChunks: unknown[] = [];
  jest.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
    writtenChunks.push(chunk);
    return true;
  });

  return {
    setupStreamWithLines: ({ lines }: { lines: readonly StreamJsonLine[] }): void => {
      rlProxy.setupLines({ lines });
    },

    setupEmptyStream: (): void => {
      rlProxy.setupEmpty();
    },

    returnsProcessWithExit: ({ exitCode }: { exitCode: ExitCode }): EventEmittingProcess => {
      const listeners: Listeners = {};
      const mockProcess = createMockProcess({ listeners, exitCode });

      // Use nested setImmediate to ensure exit fires after readline lines are emitted
      setImmediate(() => {
        setImmediate(() => {
          const exitListeners = listeners.exit;
          if (exitListeners) {
            for (const listener of exitListeners) {
              listener(exitCode);
            }
          }
        });
      });

      return mockProcess;
    },

    returnsProcessWithNullExit: (): EventEmittingProcess => {
      const listeners: Listeners = {};
      const mockProcess = createMockProcess({ listeners, exitCode: null });

      // Use nested setImmediate to ensure exit fires after readline lines are emitted
      setImmediate(() => {
        setImmediate(() => {
          const exitListeners = listeners.exit;
          if (exitListeners) {
            for (const listener of exitListeners) {
              listener(null);
            }
          }
        });
      });

      return mockProcess;
    },

    returnsProcessWithError: ({ error }: { error: Error }): EventEmittingProcess => {
      const listeners: Listeners = {};
      const mockProcess = createMockProcess({ listeners, exitCode: null });

      // Use nested setImmediate to ensure error fires after readline lines are emitted
      setImmediate(() => {
        setImmediate(() => {
          const errorListeners = listeners.error;
          if (errorListeners) {
            for (const listener of errorListeners) {
              listener(error);
            }
          }
        });
      });

      return mockProcess;
    },

    getWrittenOutput: (): StreamText => {
      const combined = writtenChunks.map((c) => String(c)).join('');
      return StreamTextStub({ value: combined });
    },
  };
};
