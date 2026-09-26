import { detectDefaultBranch } from './git-detect-default-branch';
import { gitDetectDefaultBranchProxy } from './git-detect-default-branch.proxy';

describe('detectDefaultBranch()', () => {
  it('VALID: {main exists} => returns "main"', async () => {
    const proxy = gitDetectDefaultBranchProxy();
    proxy.setupMainExists();

    const result = await detectDefaultBranch({ cwd: '/repo' });

    expect(result).toBe('main');
  });

  it('VALID: {only master exists} => returns "master"', async () => {
    const proxy = gitDetectDefaultBranchProxy();
    proxy.setupMasterExists();

    const result = await detectDefaultBranch({ cwd: '/repo' });

    expect(result).toBe('master');
  });

  it('EMPTY: {neither exists} => returns null', async () => {
    const proxy = gitDetectDefaultBranchProxy();
    proxy.setupNeitherExists();

    const result = await detectDefaultBranch({ cwd: '/repo' });

    expect(result).toBe(null);
  });
});
