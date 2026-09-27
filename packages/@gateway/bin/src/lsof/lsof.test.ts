import * as ourModule from './lsof';

describe('#gateway/bin/lsof', () => {
  it('VALID: {module} => exports listeningPids, lsofRun and LsofNotInstalledError', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual([
      'LsofNotInstalledError',
      'listeningPids',
      'lsofRun',
    ]);
  });
});
