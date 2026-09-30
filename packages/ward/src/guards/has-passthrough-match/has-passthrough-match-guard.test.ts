import { ProjectFolderStub } from '../../contracts/project-folder/project-folder.stub';
import { hasPassthroughMatchGuard } from './has-passthrough-match-guard';

describe('hasPassthroughMatchGuard', () => {
  describe('matching paths', () => {
    it('VALID: {passthrough matches package prefix} => returns true', () => {
      const rootPath = '/home/user/project';
      const projectFolder = ProjectFolderStub({ path: '/home/user/project/packages/hooks' });
      const passthroughArg = 'packages/hooks/src/foo.test.ts';

      const result = hasPassthroughMatchGuard({ passthroughArg, projectFolder, rootPath });

      expect(result).toBe(true);
    });

    it('VALID: {deeply nested passthrough path} => returns true', () => {
      const rootPath = '/home/user/project';
      const projectFolder = ProjectFolderStub({ path: '/home/user/project/packages/ward' });
      const passthroughArg = 'packages/ward/src/guards/deep/nested/file.test.ts';

      const result = hasPassthroughMatchGuard({ passthroughArg, projectFolder, rootPath });

      expect(result).toBe(true);
    });
  });

  describe('non-matching paths', () => {
    it('INVALID: {passthrough for different package} => returns false', () => {
      const rootPath = '/home/user/project';
      const projectFolder = ProjectFolderStub({ path: '/home/user/project/packages/hooks' });
      const passthroughArg = 'packages/ward/src/foo.test.ts';

      const result = hasPassthroughMatchGuard({ passthroughArg, projectFolder, rootPath });

      expect(result).toBe(false);
    });

    it('INVALID: {similar prefix but different package} => returns false', () => {
      const rootPath = '/home/user/project';
      const projectFolder = ProjectFolderStub({ path: '/home/user/project/packages/hooks' });
      const passthroughArg = 'packages/hooks-extra/src/foo.test.ts';

      const result = hasPassthroughMatchGuard({ passthroughArg, projectFolder, rootPath });

      expect(result).toBe(false);
    });

    it('INVALID: {root-level file with no packages prefix} => returns false', () => {
      const rootPath = '/home/user/project';
      const projectFolder = ProjectFolderStub({ path: '/home/user/project/packages/hooks' });
      const passthroughArg = 'eslint.config.js';

      const result = hasPassthroughMatchGuard({ passthroughArg, projectFolder, rootPath });

      expect(result).toBe(false);
    });

    it('INVALID: {passthrough is partial package name} => returns false', () => {
      const rootPath = '/home/user/project';
      const projectFolder = ProjectFolderStub({ path: '/home/user/project/packages/hooks' });
      const passthroughArg = 'packages/hook';

      const result = hasPassthroughMatchGuard({ passthroughArg, projectFolder, rootPath });

      expect(result).toBe(false);
    });
  });

  describe('package-level matching', () => {
    it('VALID: {passthrough IS the package folder without trailing slash} => returns true', () => {
      const rootPath = '/home/user/project';
      const projectFolder = ProjectFolderStub({ path: '/home/user/project/packages/hooks' });
      const passthroughArg = 'packages/hooks';

      const result = hasPassthroughMatchGuard({ passthroughArg, projectFolder, rootPath });

      expect(result).toBe(true);
    });

    it('VALID: {passthrough IS the package folder with trailing slash} => returns true', () => {
      const rootPath = '/home/user/project';
      const projectFolder = ProjectFolderStub({ path: '/home/user/project/packages/hooks' });
      const passthroughArg = 'packages/hooks/';

      const result = hasPassthroughMatchGuard({ passthroughArg, projectFolder, rootPath });

      expect(result).toBe(true);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {passthroughArg is empty string} => returns false', () => {
      const rootPath = '/home/user/project';
      const projectFolder = ProjectFolderStub({ path: '/home/user/project/packages/hooks' });
      const passthroughArg = '';

      const result = hasPassthroughMatchGuard({ passthroughArg, projectFolder, rootPath });

      expect(result).toBe(false);
    });
  });
});
