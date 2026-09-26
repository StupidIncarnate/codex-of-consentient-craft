import * as ourModule from './index';

describe('@dungeonmaster/bin/lsof', () => {
  it('VALID: {module} => exports listeningPids and LsofNotInstalledError', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual(['LsofNotInstalledError', 'listeningPids']);
  });
});
