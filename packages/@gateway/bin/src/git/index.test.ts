import * as ourModule from './index';

describe('@dungeonmaster/bin/git', () => {
  it('VALID: {module} => exports every git function plus GitNotInstalledError', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual([
      'GitNotInstalledError',
      'addAll',
      'branchDelete',
      'checkout',
      'commit',
      'currentBranch',
      'detectDefaultBranch',
      'detectOriginDefaultBranch',
      'diffFiles',
      'headSha',
      'logNameOnly',
      'push',
      'untrackedFiles',
      'upstreamSha',
      'verifyRef',
      'worktreeAdd',
      'worktreePrune',
      'worktreeRemove',
    ]);
  });
});
