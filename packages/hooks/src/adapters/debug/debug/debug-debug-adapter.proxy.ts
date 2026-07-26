import debug from 'debug';
import type { Debugger } from 'debug';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const debugDebugAdapterProxy = (): {
  returns: ({ namespace, logger }: { namespace: string; logger: Debugger }) => void;
} => {
  const mock = registerMock({ fn: debug });

  return {
    returns: ({ namespace, logger }: { namespace: string; logger: Debugger }): void => {
      mock.calledWith([namespace]).returns(logger);
    },
  };
};
