import { createInterface } from 'readline';

jest.mock('readline');

export const readlineCreateInterfaceAdapterProxy = (): {
  emitLines: (params: { lines: readonly string[] }) => void;
  setAutoEmitLines: (params: { lines: readonly string[] }) => void;
  setAutoReplayLines: (params: { lines: readonly string[] }) => void;
} => {
  const mock = jest.mocked(createInterface);
  const lineCallbacks: ((line: string) => void)[] = [];
  const autoEmitRef: {
    lines: Parameters<
      ReturnType<typeof readlineCreateInterfaceAdapterProxy>['emitLines']
    >[0]['lines'];
  } = { lines: [] };
  const storedReplayRef: {
    lines: Parameters<
      ReturnType<typeof readlineCreateInterfaceAdapterProxy>['emitLines']
    >[0]['lines'];
  } = { lines: [] };

  mock.mockImplementation(
    () =>
      ({
        on: jest.fn().mockImplementation((event: string, callback: (line: string) => void) => {
          if (event === 'line') {
            lineCallbacks.push(callback);
            if (autoEmitRef.lines.length > 0) {
              for (const emitLine of autoEmitRef.lines) {
                callback(emitLine);
              }
            }
            for (const line of storedReplayRef.lines) {
              callback(line);
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
      autoEmitRef.lines = lines;
    },
    setAutoReplayLines: ({ lines }: { lines: readonly string[] }): void => {
      storedReplayRef.lines = lines;
    },
  };
};
