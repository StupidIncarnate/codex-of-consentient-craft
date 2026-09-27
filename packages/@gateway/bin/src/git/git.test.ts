import * as ourModule from './git';

describe('#gateway/bin/git', () => {
  it('VALID: {module} => exports every git function, gitRun and GitNotInstalledError', () => {
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
      'gitRun',
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
