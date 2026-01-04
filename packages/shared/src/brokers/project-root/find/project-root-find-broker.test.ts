import { projectRootFindBroker } from './project-root-find-broker';
import { projectRootFindBrokerProxy } from './project-root-find-broker.proxy';
import { ProjectRootNotFoundError } from '../../../errors/project-root-not-found/project-root-not-found-error';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('projectRootFindBroker', () => {
  describe('project root found cases', () => {
    it('VALID: {startPath: "/project/src/file.ts"} => finds package.json in same directory', async () => {
      const proxy = projectRootFindBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src/file.ts' });

      proxy.setupProjectRootFound({
        startPath: '/project/src/file.ts',
        projectRootPath: '/project/src',
      });

      const result = await projectRootFindBroker({ startPath });

      expect(result).toBe('/project/src');
    });

    it('VALID: {startPath: "/project/sub/file.ts"} => finds package.json in parent directory', async () => {
      const proxy = projectRootFindBrokerProxy();
      const startPath = FilePathStub({ value: '/project/sub/file.ts' });

      proxy.setupProjectRootFoundInParent({
        startPath: '/project/sub/file.ts',
        parentPath: '/project',
        projectRootPath: '/project',
      });

      const result = await projectRootFindBroker({ startPath });

      expect(result).toBe('/project');
    });

    it('VALID: {startPath: "/deep/nested/project/src/file.ts"} => finds package.json walking up multiple levels', async () => {
      const proxy = projectRootFindBrokerProxy();
      const startPath = FilePathStub({ value: '/deep/nested/project/src/file.ts' });

      proxy.setupProjectRootFoundInParent({
        startPath: '/deep/nested/project/src/file.ts',
        parentPath: '/deep',
        projectRootPath: '/deep',
      });

      const result = await projectRootFindBroker({ startPath });

      expect(result).toBe('/deep');
    });

    it('VALID: {startPath: "/root-project/file.ts"} => finds package.json at filesystem root', async () => {
      const proxy = projectRootFindBrokerProxy();
      const startPath = FilePathStub({ value: '/root-project/file.ts' });

      proxy.setupProjectRootFoundInParent({
        startPath: '/root-project/file.ts',
        parentPath: '/',
        projectRootPath: '/',
      });

      const result = await projectRootFindBroker({ startPath });

      expect(result).toBe('/');
    });
  });

  describe('project root not found cases', () => {
    it('ERROR: {startPath: "/project/file.ts"} => throws ProjectRootNotFoundError when no package.json exists', async () => {
      const proxy = projectRootFindBrokerProxy();
      const startPath = FilePathStub({ value: '/project/file.ts' });

      proxy.setupProjectRootNotFound({ startPath: '/project/file.ts' });

      await expect(projectRootFindBroker({ startPath })).rejects.toThrow(ProjectRootNotFoundError);
    });

    it('ERROR: {startPath: "/deep/nested/file.ts"} => throws ProjectRootNotFoundError after walking entire tree', async () => {
      const proxy = projectRootFindBrokerProxy();
      const startPath = FilePathStub({ value: '/deep/nested/file.ts' });

      proxy.setupProjectRootNotFound({ startPath: '/deep/nested/file.ts' });

      await expect(projectRootFindBroker({ startPath })).rejects.toThrow(ProjectRootNotFoundError);
    });
  });

  describe('directory path cases', () => {
    it('VALID: {startPath: "/project"} => finds package.json when startPath is a directory containing it', async () => {
      const proxy = projectRootFindBrokerProxy();
      const startPath = FilePathStub({ value: '/project' });

      proxy.setupProjectRootFoundInDirectory({
        directoryPath: '/project',
      });

      const result = await projectRootFindBroker({ startPath });

      expect(result).toBe('/project');
    });

    it('VALID: {startPath: "/project/subdir"} => finds package.json in parent when startPath is a directory', async () => {
      const proxy = projectRootFindBrokerProxy();
      const startPath = FilePathStub({ value: '/project/subdir' });

      proxy.setupProjectRootFoundInDirectoryParent({
        directoryPath: '/project/subdir',
        projectRootPath: '/project',
      });

      const result = await projectRootFindBroker({ startPath });

      expect(result).toBe('/project');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {startPath: "/file.ts"} => finds package.json at root or throws error', async () => {
      const proxy = projectRootFindBrokerProxy();
      const startPath = FilePathStub({ value: '/file.ts' });

      proxy.setupProjectRootNotFound({ startPath: '/file.ts' });

      await expect(projectRootFindBroker({ startPath })).rejects.toThrow(ProjectRootNotFoundError);
    });

    it('EDGE: {startPath: "/project/.hidden"} => handles hidden files as start path', async () => {
      const proxy = projectRootFindBrokerProxy();
      const startPath = FilePathStub({ value: '/project/.hidden' });

      proxy.setupProjectRootFound({
        startPath: '/project/.hidden',
        projectRootPath: '/project',
      });

      const result = await projectRootFindBroker({ startPath });

      expect(result).toBe('/project');
    });

    it('EDGE: {startPath: "/path with spaces/file.ts"} => handles paths with spaces', async () => {
      const proxy = projectRootFindBrokerProxy();
      const startPath = FilePathStub({ value: '/path with spaces/file.ts' });

      proxy.setupProjectRootFound({
        startPath: '/path with spaces/file.ts',
        projectRootPath: '/path with spaces',
      });

      const result = await projectRootFindBroker({ startPath });

      expect(result).toBe('/path with spaces');
    });
  });
});
