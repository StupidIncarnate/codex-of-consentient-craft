import { spawnDetached } from './spawn-detached';

describe('spawnDetached()', () => {
  describe('real spawn of a missing program', () => {
    it('ERROR: {program does not exist} => throws, and the late spawn error never crashes the process', async () => {
      const attempt = (): unknown =>
        spawnDetached({
          command: 'definitely-not-a-real-command-sd9',
          args: [],
          cwd: '/tmp',
          stdoutFd: 1,
          stderrFd: 2,
        });

      expect(attempt).toThrow(
        /^spawnDetached: spawning "definitely-not-a-real-command-sd9" produced no pid — the process never started$/u,
      );

      // Node emits the spawn failure as an 'error' event on a later tick. With no listener it is an
      // uncaught exception, which fails this test.
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(process.pid).toBeGreaterThan(0);
    });
  });
});
