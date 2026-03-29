import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

export const processDevLogAdapterProxy = (): {
  enableDev: () => void;
  disableDev: () => void;
  getWrittenLines: () => SpyOnHandle;
} => {
  const spy = registerSpyOn({ object: process.stdout, method: 'write', passthrough: true });
  spy.mockImplementation((): boolean => true);

  return {
    enableDev: (): void => {
      process.env.DUNGEONMASTER_ENV = 'dev';
    },
    disableDev: (): void => {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_ENV');
    },
    getWrittenLines: (): SpyOnHandle => spy,
  };
};
