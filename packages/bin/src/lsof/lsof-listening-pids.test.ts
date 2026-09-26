import { listeningPids } from './lsof-listening-pids';
import { lsofListeningPidsProxy } from './lsof-listening-pids.proxy';
import { LsofNotInstalledError } from './lsof-not-installed-error';

describe('listeningPids()', () => {
  it('VALID: {two pids listening} => returns both as numbers', async () => {
    const proxy = lsofListeningPidsProxy();
    proxy.setupPids({ port: 3737, pids: [111, 222] });

    const result = await listeningPids({ port: 3737 });

    expect(result).toStrictEqual([111, 222]);
  });

  it('EMPTY: {nothing listening} => returns an empty array', async () => {
    const proxy = lsofListeningPidsProxy();
    proxy.setupNoneListening({ port: 3737 });

    const result = await listeningPids({ port: 3737 });

    expect(result).toStrictEqual([]);
  });

  it('ERROR: {run throws RunNotFoundError} => throws LsofNotInstalledError, never an empty array', async () => {
    const proxy = lsofListeningPidsProxy();
    proxy.setupNotFound({ port: 3737, message: 'spawn lsof ENOENT' });

    await expect(listeningPids({ port: 3737 })).rejects.toStrictEqual(
      new LsofNotInstalledError(
        'lsof -ti :3737 could not start: "lsof" never started: spawn lsof ENOENT',
      ),
    );
  });
});
