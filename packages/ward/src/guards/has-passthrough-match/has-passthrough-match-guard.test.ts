import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { CliArgStub } from '../../contracts/cli-arg/cli-arg.stub';
import { ProjectFolderStub } from '../../contracts/project-folder/project-folder.stub';
import { hasPassthroughMatchGuard } from './has-passthrough-match-guard';

describe('hasPassthroughMatchGuard', () => {
  describe('matching paths', () => {
    it('VALID: {passthrough matches package prefix} => returns true', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const projectFolder = ProjectFolderStub({ path: '/home/user/project/packages/hooks' });
      const passthroughArg = CliArgStub({ value: 'packages/hooks/src/foo.test.ts' });

      const result = hasPassthroughMatchGuard({ passthroughArg, projectFolder, rootPath });

      expect(result).toBe(true);
    });

    it('VALID: {deeply nested passthrough path} => returns true', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const projectFolder = ProjectFolderStub({ path: '/home/user/project/packages/ward' });
      const passthroughArg = CliArgStub({
        value: 'packages/ward/src/guards/deep/nested/file.test.ts',
      });

      const result = hasPassthroughMatchGuard({ passthroughArg, projectFolder, rootPath });

      expect(result).toBe(true);
    });
  });

  describe('non-matching paths', () => {
    it('INVALID_PASSTHROUGH: {passthrough for different package} => returns false', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const projectFolder = ProjectFolderStub({ path: '/home/user/project/packages/hooks' });
      const passthroughArg = CliArgStub({ value: 'packages/ward/src/foo.test.ts' });

      const result = hasPassthroughMatchGuard({ passthroughArg, projectFolder, rootPath });

      expect(result).toBe(false);
    });

    it('INVALID_PASSTHROUGH: {similar prefix but different package} => returns false', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const projectFolder = ProjectFolderStub({ path: '/home/user/project/packages/hooks' });
      const passthroughArg = CliArgStub({ value: 'packages/hooks-extra/src/foo.test.ts' });

      const result = hasPassthroughMatchGuard({ passthroughArg, projectFolder, rootPath });

      expect(result).toBe(false);
    });

    it('INVALID_PASSTHROUGH: {root-level file with no packages prefix} => returns false', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const projectFolder = ProjectFolderStub({ path: '/home/user/project/packages/hooks' });
      const passthroughArg = CliArgStub({ value: 'eslint.config.js' });

      const result = hasPassthroughMatchGuard({ passthroughArg, projectFolder, rootPath });

      expect(result).toBe(false);
    });

    it('INVALID_PASSTHROUGH: {passthrough IS the package folder with no trailing file} => returns false', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const projectFolder = ProjectFolderStub({ path: '/home/user/project/packages/hooks' });
      const passthroughArg = CliArgStub({ value: 'packages/hooks' });

      const result = hasPassthroughMatchGuard({ passthroughArg, projectFolder, rootPath });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {passthroughArg is empty string} => returns false', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const projectFolder = ProjectFolderStub({ path: '/home/user/project/packages/hooks' });
      const passthroughArg = CliArgStub({ value: '' });

      const result = hasPassthroughMatchGuard({ passthroughArg, projectFolder, rootPath });

      expect(result).toBe(false);
    });
  });
});
