import { createInterface } from 'readline';
import { Readable } from 'stream';
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

  // createInterface is a SHARED npm function — fsWatchTailAdapterProxy also mocks it (for
  // tailing a file via createReadStream) with its own address. A bare calledWith([]) here
  // would collide: whichever proxy registers last wins the tie for EVERY call, silently
  // routing the file-tailer's stdout reads (or vice versa) — see the sibling proxy's
  // comment for the incident this caused.
  //
  // childProcessSpawnStreamJsonAdapterProxy hands this adapter the mocked child process's
  // `stdout`, built via `Readable.from(...)` (a real `stream.Readable` instance).
  // fsWatchTailAdapterProxy's own createInterface call instead passes a bare `EventEmitter`
  // it fabricates for its mocked `createReadStream` result — never a real `Readable`. That
  // makes `input instanceof Readable` a genuine, self-contained discriminator: true only for
  // the stdout-reader call this proxy answers, false for the file-tailer's call.
  const isChildProcessStdoutInput = (arg: unknown): boolean => {
    const options = arg as { input?: unknown } | undefined;
    return options?.input instanceof Readable;
  };

  mock.calledWith([isChildProcessStdoutInput]).implement(
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
