import { projectRootCwdContract } from './project-root-cwd-contract';
import { ProjectRootCwdStub as _ProjectRootCwdStub } from './project-root-cwd.stub';

describe('projectRootCwdContract', () => {
  describe('valid absolute paths', () => {
    it('VALID: {path: "/home/user/project/packages/web"} => parses successfully', () => {
      const result = projectRootCwdContract.parse('/home/user/project/packages/web');

      expect(result).toBe('/home/user/project/packages/web');
    });

    it('VALID: {path: "C:\\\\Projects\\\\app"} => parses successfully', () => {
      const result = projectRootCwdContract.parse('C:\\Projects\\app');

      expect(result).toBe('C:\\Projects\\app');
    });
  });

  describe('invalid relative paths', () => {
    it('INVALID: {path: "./relative"} => throws validation error', () => {
      expect(() => {
        return projectRootCwdContract.parse('./relative');
      }).toThrow('Path must be absolute');
    });

    it('INVALID: {path: "../parent"} => throws validation error', () => {
      expect(() => {
        return projectRootCwdContract.parse('../parent');
      }).toThrow('Path must be absolute');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {path: ""} => throws ZodError', () => {
      expect(() => {
        return projectRootCwdContract.parse('');
      }).toThrow('String must contain at least 1 character');
    });

    it('INVALID: {path: 123} => throws ZodError', () => {
      expect(() => {
        return projectRootCwdContract.parse(123);
      }).toThrow('Expected string');
    });

    it('INVALID: {path: null} => throws ZodError', () => {
      expect(() => {
        return projectRootCwdContract.parse(null);
      }).toThrow('Expected string');
    });
  });
});
