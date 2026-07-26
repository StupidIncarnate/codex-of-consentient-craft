import { cwd } from 'process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const processCwdAdapterProxy = (): {
  returns: ({ path }: { path: string }) => void;
} => {
  const handle = registerMock({ fn: cwd });

  // cwd() takes no arguments — there is no call-site value to key on, so [] is the honest
  // address, not a shortcut. Sticky default; a later `returns()` call is a live override.
  handle.calledWith([]).returns('/default/cwd');

  return {
    returns: ({ path }: { path: string }): void => {
      handle.onceFor([]).returns(path);
    },
  };
};
