import { spawnDetached } from './spawn-detached';
import { spawnDetachedProxy } from './spawn-detached.proxy';

describe('spawnDetached()', () => {
  describe('successful spawn', () => {
    it('VALID: {spawn produces a pid} => returns pid and pgid equal to it, its own group leader', () => {
      const proxy = spawnDetachedProxy();
      proxy.setupSuccess({ command: 'npm', pid: 4821 });

      const result = spawnDetached({
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        cwd: '/repo',
        stdoutFd: 12,
        stderrFd: 12,
      });

      expect(result).toStrictEqual({ pid: 4821, pgid: 4821 });
    });

    it('VALID: {stdoutFd, stderrFd} => spawns detached, stdin ignored, stdio wired to the given fds', () => {
      const proxy = spawnDetachedProxy();
      proxy.setupSuccess({ command: 'npm', pid: 4821 });

      spawnDetached({
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        cwd: '/repo',
        stdoutFd: 12,
        stderrFd: 13,
      });

      const options = proxy.getSpawnedOptions({ command: 'npm' });
      const { detached, stdio } = options as { detached?: unknown; stdio?: unknown };

      expect(detached).toBe(true);
      expect(stdio).toStrictEqual(['ignore', 12, 13]);
    });
  });

  describe('spawn never started', () => {
    it('ERROR: {spawn produces no pid} => throws, naming the command', () => {
      const proxy = spawnDetachedProxy();
      proxy.setupNoPid({ command: 'nonexistent' });

      expect(() =>
        spawnDetached({
          command: 'nonexistent',
          args: [],
          cwd: '/repo',
          stdoutFd: 12,
          stderrFd: 12,
        }),
      ).toThrow(/spawning "nonexistent" produced no pid/u);
    });
  });
});
