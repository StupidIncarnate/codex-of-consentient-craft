import * as ourModule from './index';

describe('@dungeonmaster/bin/kill', () => {
  it('VALID: {module} => exports killPid, killGroup, KillNotInstalledError', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual([
      'KillNotInstalledError',
      'killGroup',
      'killPid',
    ]);
  });
});
