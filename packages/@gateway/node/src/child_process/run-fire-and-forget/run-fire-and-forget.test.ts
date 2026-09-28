import { runFireAndForget } from './run-fire-and-forget';
import { runFireAndForgetProxy } from './run-fire-and-forget.proxy';

describe('runFireAndForget()', () => {
  describe('successful spawn', () => {
    it('VALID: {command} => runs without logging any failure', () => {
      const proxy = runFireAndForgetProxy();
      proxy.setupSuccess({ command: 'open http://localhost:3737' });

      runFireAndForget({ command: 'open http://localhost:3737' });

      expect(proxy.captureStderrWrites()).toStrictEqual([]);
    });
  });

  describe('command never starts', () => {
    it('ERROR: {command fails to start} => logs to stderr instead of crashing the process', async () => {
      const proxy = runFireAndForgetProxy();
      proxy.setupSpawnError({
        command: 'nonexistent-open',
        error: Object.assign(new Error('spawn nonexistent-open ENOENT'), { code: 'ENOENT' }),
      });

      runFireAndForget({ command: 'nonexistent-open' });

      // Give the mock's setImmediate a turn to fire the 'error' event before asserting.
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(
        proxy
          .captureStderrWrites()
          .some((line) => line.includes('"nonexistent-open" failed to start')),
      ).toBe(true);
    });
  });

  describe('getCallsFor', () => {
    it('VALID: {exact command} => reads back arguments of the matching call', () => {
      const proxy = runFireAndForgetProxy();
      proxy.setupSuccess({ command: 'open http://localhost:3737' });

      runFireAndForget({ command: 'open http://localhost:3737' });

      expect(proxy.getCallsFor({ command: 'open http://localhost:3737' })).toStrictEqual([
        ['open http://localhost:3737'],
      ]);
    });

    it('VALID: {predicate command} => reads back arguments matching the predicate', () => {
      const proxy = runFireAndForgetProxy();
      proxy.setupSuccess({ command: 'open http://localhost:3737' });

      runFireAndForget({ command: 'open http://localhost:3737' });

      expect(
        proxy.getCallsFor({
          command: (cmd: unknown) => String(cmd).startsWith('open'),
        }),
      ).toStrictEqual([['open http://localhost:3737']]);
    });

    it('EMPTY: {unmatched command} => returns empty array', () => {
      const proxy = runFireAndForgetProxy();
      proxy.setupSuccess({ command: 'open http://localhost:3737' });

      runFireAndForget({ command: 'open http://localhost:3737' });

      expect(proxy.getCallsFor({ command: 'xdg-open http://localhost:3737' })).toStrictEqual([]);
    });
  });
});
