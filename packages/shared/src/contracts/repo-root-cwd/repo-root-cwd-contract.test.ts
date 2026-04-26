import { repoRootCwdContract } from './repo-root-cwd-contract';
import { RepoRootCwdStub as _RepoRootCwdStub } from './repo-root-cwd.stub';

describe('repoRootCwdContract', () => {
  describe('valid absolute paths', () => {
    it('VALID: {path: "/home/user/project"} => parses successfully', () => {
      const result = repoRootCwdContract.parse('/home/user/project');

      expect(result).toBe('/home/user/project');
    });

    it('VALID: {path: "C:\\\\Users\\\\me\\\\project"} => parses successfully', () => {
      const result = repoRootCwdContract.parse('C:\\Users\\me\\project');

      expect(result).toBe('C:\\Users\\me\\project');
    });
  });

  describe('invalid relative paths', () => {
    it('INVALID: {path: "./relative"} => throws validation error', () => {
      expect(() => {
        return repoRootCwdContract.parse('./relative');
      }).toThrow('Path must be absolute');
    });

    it('INVALID: {path: "../parent"} => throws validation error', () => {
      expect(() => {
        return repoRootCwdContract.parse('../parent');
      }).toThrow('Path must be absolute');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {path: ""} => throws ZodError', () => {
      expect(() => {
        return repoRootCwdContract.parse('');
      }).toThrow('String must contain at least 1 character');
    });

    it('INVALID: {path: 123} => throws ZodError', () => {
      expect(() => {
        return repoRootCwdContract.parse(123);
      }).toThrow('Expected string');
    });

    it('INVALID: {path: null} => throws ZodError', () => {
      expect(() => {
        return repoRootCwdContract.parse(null);
      }).toThrow('Expected string');
    });
  });
});
