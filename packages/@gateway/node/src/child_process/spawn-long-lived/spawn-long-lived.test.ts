import { spawnLongLived } from './spawn-long-lived';
import { spawnLongLivedProxy } from './spawn-long-lived.proxy';

describe('spawnLongLived()', () => {
  describe('kill()', () => {
    it('VALID: {kill called once} => sends SIGTERM to the child exactly once', () => {
      const proxy = spawnLongLivedProxy();
      const { killMock } = proxy.setupSuccess({ command: 'npx' });

      const { kill } = spawnLongLived({ command: 'npx', args: ['vite'], cwd: '/path' });
      kill();

      expect(killMock()).toBe(1);
    });

    it('EDGE: {kill called twice} => the second call is a no-op, child already killed', () => {
      const proxy = spawnLongLivedProxy();
      const { killMock } = proxy.setupSuccess({ command: 'npx' });

      const { kill } = spawnLongLived({ command: 'npx', args: ['vite'], cwd: '/path' });
      kill();
      kill();

      expect(killMock()).toBe(1);
    });
  });

  describe('spawn error', () => {
    it('ERROR: {command never starts} => logs to stderr instead of crashing the process', async () => {
      const proxy = spawnLongLivedProxy();
      proxy.setupSpawnError({
        command: 'nonexistent',
        error: Object.assign(new Error('spawn nonexistent ENOENT'), { code: 'ENOENT' }),
      });

      const { kill } = spawnLongLived({ command: 'nonexistent', args: [], cwd: '/path' });

      // Give the mock's setImmediate a turn to fire the 'error' event before asserting.
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(
        proxy.captureStderrWrites().some((line) => line.includes('"nonexistent" failed to start')),
      ).toBe(true);
      expect(kill).toStrictEqual(expect.any(Function));
    });
  });

  describe('getCallsFor()', () => {
    it('VALID: {spawned with args and cwd} => the full argument tuple is read back', () => {
      const proxy = spawnLongLivedProxy();
      proxy.setupSuccess({ command: 'npx' });

      spawnLongLived({ command: 'npx', args: ['vite'], cwd: '/path' });

      expect(proxy.getCallsFor({ command: 'npx' })).toStrictEqual([
        ['npx', ['vite'], { cwd: '/path', stdio: 'pipe', detached: false }],
      ]);
    });
  });
});
