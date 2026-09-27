import { detectOriginDefaultBranch } from './detect-origin-default-branch';
import { detectOriginDefaultBranchProxy } from './detect-origin-default-branch.proxy';

describe('detectOriginDefaultBranch()', () => {
  it('VALID: {origin/main exists} => returns "origin/main"', async () => {
    const proxy = detectOriginDefaultBranchProxy();
    proxy.setupOriginMainExists();

    const result = await detectOriginDefaultBranch({ cwd: '/repo' });

    expect(result).toBe('origin/main');
  });

  it('VALID: {only origin/master exists} => returns "origin/master"', async () => {
    const proxy = detectOriginDefaultBranchProxy();
    proxy.setupOriginMasterExists();

    const result = await detectOriginDefaultBranch({ cwd: '/repo' });

    expect(result).toBe('origin/master');
  });

  it('EMPTY: {neither exists} => returns null', async () => {
    const proxy = detectOriginDefaultBranchProxy();
    proxy.setupNeitherExists();

    const result = await detectOriginDefaultBranch({ cwd: '/repo' });

    expect(result).toBe(null);
  });
});
