import * as ourModule from './npm';

describe('#gateway/bin/npm', () => {
  it('VALID: {module} => exports install, runBuild, runScript, npmRun, NpmNotInstalledError', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual([
      'NpmNotInstalledError',
      'install',
      'npmRun',
      'runBuild',
      'runScript',
    ]);
  });
});
