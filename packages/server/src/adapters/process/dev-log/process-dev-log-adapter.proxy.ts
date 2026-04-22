import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

export const processDevLogAdapterProxy = (): {
  enableVerbose: () => void;
  disableVerbose: () => void;
  getWrittenLines: () => SpyOnHandle;
} => {
  const spy = registerSpyOn({ object: process.stdout, method: 'write', passthrough: true });
  spy.mockImplementation((): boolean => true);

  return {
    enableVerbose: (): void => {
      process.env.VERBOSE = '1';
    },
    disableVerbose: (): void => {
      Reflect.deleteProperty(process.env, 'VERBOSE');
    },
    getWrittenLines: (): SpyOnHandle => spy,
  };
};
