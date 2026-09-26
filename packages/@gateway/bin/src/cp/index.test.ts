import * as ourModule from './index';

describe('@dungeonmaster/bin/cp', () => {
  it('VALID: {module} => exports copyRecursive, CpNotInstalledError', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual(['CpNotInstalledError', 'copyRecursive']);
  });
});
