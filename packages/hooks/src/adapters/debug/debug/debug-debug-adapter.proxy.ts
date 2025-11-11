jest.mock('debug');

import debug from 'debug';
import type { Debugger } from 'debug';

export const debugDebugAdapterProxy = (): {
  returns: ({ logger }: { logger: Debugger }) => void;
} => {
  const mock = jest.mocked(debug);

  // Create a mock logger function (a no-op function that acts as Debugger)
  const defaultLogger = jest.fn() as unknown as Debugger;
  mock.mockReturnValue(defaultLogger);

  return {
    returns: ({ logger }: { logger: Debugger }) => {
      mock.mockReturnValueOnce(logger);
    },
  };
};
