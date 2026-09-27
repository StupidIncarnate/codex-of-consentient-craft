import * as ourModule from './kill';

describe('#gateway/bin/kill', () => {
  it('VALID: {module} => exports killPid, killGroup, killRun, KillNotInstalledError', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual([
      'KillNotInstalledError',
      'killGroup',
      'killPid',
      'killRun',
    ]);
  });
});
