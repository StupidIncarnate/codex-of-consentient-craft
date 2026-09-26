import * as ourModule from './index';

describe('@dungeonmaster/bin/claude', () => {
  it('VALID: {module} => exports ClaudeNotInstalledError, resolveClaudeCliPath, and spawnStreamJson', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual([
      'ClaudeNotInstalledError',
      'resolveClaudeCliPath',
      'spawnStreamJson',
    ]);
  });
});
