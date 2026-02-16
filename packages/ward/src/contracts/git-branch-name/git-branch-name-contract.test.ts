import { GitBranchNameStub } from './git-branch-name.stub';
import { gitBranchNameContract } from './git-branch-name-contract';

describe('gitBranchNameContract', () => {
  describe('valid branch names', () => {
    it('VALID: {main branch} => parses successfully', () => {
      const result = gitBranchNameContract.parse('main');

      expect(result).toBe('main');
    });

    it('VALID: {master branch} => parses successfully', () => {
      const result = gitBranchNameContract.parse('master');

      expect(result).toBe('master');
    });

    it('VALID: {feature branch} => parses successfully', () => {
      const result = gitBranchNameContract.parse('feature/my-branch');

      expect(result).toBe('feature/my-branch');
    });

    it('VALID: {stub usage} => creates GitBranchName', () => {
      const result = GitBranchNameStub({ value: 'main' });

      expect(result).toBe('main');
    });
  });

  describe('invalid branch names', () => {
    it('INVALID: {empty string} => throws error', () => {
      expect(() => gitBranchNameContract.parse('')).toThrow(
        'String must contain at least 1 character(s)',
      );
    });
  });
});
