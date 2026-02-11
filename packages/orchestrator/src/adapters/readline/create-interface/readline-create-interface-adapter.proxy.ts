import { createInterface } from 'readline';

jest.mock('readline');

export const readlineCreateInterfaceAdapterProxy = (): {
  emitLines: (params: { lines: readonly string[] }) => void;
} => {
  const mock = jest.mocked(createInterface);
  const lineCallbacks: ((line: string) => void)[] = [];

  mock.mockImplementation(
    () =>
      ({
        on: jest.fn().mockImplementation((event: string, callback: (line: string) => void) => {
          if (event === 'line') {
            lineCallbacks.push(callback);
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
  };
};
