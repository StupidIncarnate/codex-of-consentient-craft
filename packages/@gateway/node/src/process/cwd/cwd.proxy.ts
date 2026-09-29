import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

// Nothing is spied until a test calls setupCwd, so a caller that never stages a directory reads
// the real process.cwd(). process.cwd takes no argument, so the one staged value answers every
// read until the next setupCwd replaces it.
export const cwdProxy = (): {
  setupCwd: (params: { value: string }) => void;
} => ({
  setupCwd: ({ value }: { value: string }): void => {
    const handle = registerSpyOn({ object: process, method: 'cwd', passthrough: true });
    handle.calledWith([]).returns(value);
  },
});
