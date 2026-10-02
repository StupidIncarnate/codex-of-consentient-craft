import * as ourModule from './git';

describe('#gateway/bin/git', () => {
  it('VALID: {module} => exports every git function, gitRun, gitRunSync and both error classes', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual([
      'GitCommandFailedError',
      'GitNotInstalledError',
      'addAll',
      'branchDelete',
      'checkout',
      'commit',
      'commonDir',
      'currentBranch',
      'detectDefaultBranch',
      'detectOriginDefaultBranch',
      'diffFiles',
      'gitRun',
      'gitRunSync',
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
