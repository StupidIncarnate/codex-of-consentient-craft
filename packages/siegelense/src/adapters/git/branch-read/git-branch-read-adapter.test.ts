import { gitBranchReadAdapter } from './git-branch-read-adapter';
import { gitBranchReadAdapterProxy } from './git-branch-read-adapter.proxy';

describe('gitBranchReadAdapter', () => {
  describe('a valid git branch', () => {
    it('VALID: {execSync returns branch name} => returns the parsed branch name', () => {
      const proxy = gitBranchReadAdapterProxy();
      proxy.setupBranch({ branch: 'feat/def-04' });

      const result = gitBranchReadAdapter();

      expect(result).toBe('feat/def-04');
    });
  });

  describe('detached HEAD', () => {
    it('EDGE: {execSync returns "HEAD"} => returns null', () => {
      const proxy = gitBranchReadAdapterProxy();
      proxy.setupBranch({ branch: null });

      const result = gitBranchReadAdapter();

      expect(result).toBe(null);
    });
  });

  describe('git command failure', () => {
    it('ERROR: {execSync throws} => returns null safely without throwing', () => {
      const proxy = gitBranchReadAdapterProxy();
      proxy.setupThrows();

      const result = gitBranchReadAdapter();

      expect(result).toBe(null);
    });
  });
});
