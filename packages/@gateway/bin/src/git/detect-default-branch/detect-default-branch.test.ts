import { detectDefaultBranch } from './detect-default-branch';
import { detectDefaultBranchProxy } from './detect-default-branch.proxy';

describe('detectDefaultBranch()', () => {
  it('VALID: {main exists} => returns "main"', async () => {
    const proxy = detectDefaultBranchProxy();
    proxy.setupMainExists();

    const result = await detectDefaultBranch({ cwd: '/repo' });

    expect(result).toBe('main');
  });

  it('VALID: {only master exists} => returns "master"', async () => {
    const proxy = detectDefaultBranchProxy();
    proxy.setupMasterExists();

    const result = await detectDefaultBranch({ cwd: '/repo' });

    expect(result).toBe('master');
  });

  it('EMPTY: {neither exists} => returns null', async () => {
    const proxy = detectDefaultBranchProxy();
    proxy.setupNeitherExists();

    const result = await detectDefaultBranch({ cwd: '/repo' });

    expect(result).toBe(null);
  });
});
