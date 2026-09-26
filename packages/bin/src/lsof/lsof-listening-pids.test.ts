import { listeningPids } from './lsof-listening-pids';
import { lsofListeningPidsProxy } from './lsof-listening-pids.proxy';

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
});
