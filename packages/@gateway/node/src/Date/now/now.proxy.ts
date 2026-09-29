import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

// Date.now takes no argument, so there is nothing to key a stage on: the one staged value answers
// every read until the next setupNow replaces it. Nothing is staged by default, so a test that
// reads the clock without saying what it is fails loudly.
export const nowProxy = (): {
  setupNow: (params: { ms: number }) => void;
} => {
  const handle = registerSpyOn({ object: Date, method: 'now' });

  return {
    setupNow: ({ ms }: { ms: number }): void => {
      handle.calledWith([]).returns(ms);
    },
  };
};
