import { createInterface } from 'readline';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

export const readlineCreateInterfaceAdapterProxy = (): {
  emitLines: (params: { lines: readonly string[] }) => void;
  setAutoEmitLines: (params: { lines: readonly string[] }) => void;
  skipAutoEmitOnce: () => void;
} => {
  const mock: MockHandle = registerMock({ fn: createInterface });
  const lineCallbacks: ((line: string) => void)[] = [];
  const autoLines = [] as Parameters<
    ReturnType<typeof readlineCreateInterfaceAdapterProxy>['emitLines']
  >[0][];
  const skipAutoEmitQueue: boolean[] = [];

  mock.mockImplementation(
    () =>
      ({
        on: jest.fn().mockImplementation((event: string, callback: (line: string) => void) => {
          if (event === 'line') {
            lineCallbacks.push(callback);
            if (skipAutoEmitQueue.length > 0) {
              skipAutoEmitQueue.pop();
              return;
            }
            if (autoLines.length > 0) {
              const [config] = autoLines;
              if (config) {
                // Use queueMicrotask so lines arrive before setImmediate-based exit
                queueMicrotask(() => {
                  for (const autoLine of config.lines) {
                    callback(autoLine);
                  }
                });
              }
            }
          }
        }),
        close: jest.fn(),
      }) as never,
  );

  return {
    emitLines: ({ lines }: { lines: readonly string[] }): void => {
      for (const line of lines) {
        for (const callback of lineCallbacks) {
          callback(line);
        }
      }
    },
    setAutoEmitLines: ({ lines }: { lines: readonly string[] }): void => {
      autoLines.push({ lines });
    },
    skipAutoEmitOnce: (): void => {
      skipAutoEmitQueue.push(true);
    },
  };
};
