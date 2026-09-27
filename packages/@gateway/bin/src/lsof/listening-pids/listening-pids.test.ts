import { listeningPids } from './listening-pids';
import { listeningPidsProxy } from './listening-pids.proxy';
import { LsofNotInstalledError } from '../lsof-run/lsof-not-installed.error';

describe('listeningPids()', () => {
  it('VALID: {two pids listening} => returns both as numbers', async () => {
    const proxy = listeningPidsProxy();
    proxy.setupPids({ port: 3737, pids: [111, 222] });

    const result = await listeningPids({ port: 3737 });

    expect(result).toStrictEqual([111, 222]);
  });

  it('EMPTY: {nothing listening} => returns an empty array', async () => {
    const proxy = listeningPidsProxy();
    proxy.setupNoneListening({ port: 3737 });

    const result = await listeningPids({ port: 3737 });

    expect(result).toStrictEqual([]);
  });

  it('ERROR: {run throws RunNotFoundError} => throws LsofNotInstalledError, never an empty array', async () => {
    const proxy = listeningPidsProxy();
    proxy.setupNotFound({ port: 3737, message: 'spawn lsof ENOENT' });

    await expect(listeningPids({ port: 3737 })).rejects.toStrictEqual(
      new LsofNotInstalledError(
        'lsof -ti :3737 could not start: "lsof" never started: spawn lsof ENOENT',
      ),
    );
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPort, a predicate} => resolves for a port the predicate accepts', async () => {
      const proxy = listeningPidsProxy();
      proxy.returnsMatchingPort({
        port: (value) => String(value).startsWith(':'),
        pids: [111, 222],
      });

      const result = await listeningPids({ port: 4242 });

      expect(result).toStrictEqual([111, 222]);
    });

    it('EMPTY: {noneListeningMatchingPort, a predicate} => resolves to an empty array', async () => {
      const proxy = listeningPidsProxy();
      proxy.noneListeningMatchingPort({ port: (value) => String(value).startsWith(':') });

      const result = await listeningPids({ port: 4242 });

      expect(result).toStrictEqual([]);
    });

    it('ERROR: {throwsMatchingPort, a predicate} => throws LsofNotInstalledError', async () => {
      const proxy = listeningPidsProxy();
      proxy.throwsMatchingPort({
        port: (value) => String(value).startsWith(':'),
        message: 'spawn lsof ENOENT',
      });

      await expect(listeningPids({ port: 4242 })).rejects.toStrictEqual(
        new LsofNotInstalledError(
          'lsof -ti :4242 could not start: "lsof" never started: spawn lsof ENOENT',
        ),
      );
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the real call', async () => {
      const proxy = listeningPidsProxy();
      proxy.setupPids({ port: 3737, pids: [111] });

      await listeningPids({ port: 3737 });

      expect(proxy.getCallsFor({ port: 3737 })).toStrictEqual([
        [{ command: 'lsof', args: ['-ti', ':3737'], cwd: '/' }],
      ]);
    });
  });
});
