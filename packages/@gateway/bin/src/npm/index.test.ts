import * as ourModule from './index';

describe('@dungeonmaster/bin/npm', () => {
  it('VALID: {module} => exports install, runBuild, runScript, NpmNotInstalledError', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual([
      'NpmNotInstalledError',
      'install',
      'runBuild',
      'runScript',
    ]);
  });
});
