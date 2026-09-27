import * as ourModule from './cp';

describe('#gateway/bin/cp', () => {
  it('VALID: {module} => exports copyRecursive, cpRun, CpNotInstalledError', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual([
      'CpNotInstalledError',
      'copyRecursive',
      'cpRun',
    ]);
  });
});
