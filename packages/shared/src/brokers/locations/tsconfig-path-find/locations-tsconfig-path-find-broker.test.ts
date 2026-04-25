import { locationsTsconfigPathFindBroker } from './locations-tsconfig-path-find-broker';
import { locationsTsconfigPathFindBrokerProxy } from './locations-tsconfig-path-find-broker.proxy';
import { ProjectRootNotFoundError } from '../../../errors/project-root-not-found/project-root-not-found-error';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('locationsTsconfigPathFindBroker', () => {
  describe('tsconfig found cases', () => {
    it('VALID: {startPath: "/project"} => returns /project/tsconfig.json', async () => {
      const proxy = locationsTsconfigPathFindBrokerProxy();

      proxy.setupTsconfigFound({ searchPath: '/project' });

      const result = await locationsTsconfigPathFindBroker({
        startPath: FilePathStub({ value: '/project' }),
      });

      expect(result).toBe(AbsoluteFilePathStub({ value: '/project/tsconfig.json' }));
    });

    it('VALID: {startPath: "/project/src/sub"} => walks up two levels and returns /project/tsconfig.json', async () => {
      const proxy = locationsTsconfigPathFindBrokerProxy();

      proxy.setupTsconfigMissingWithParent({
        searchPath: '/project/src/sub',
        parentPath: '/project/src',
      });
      proxy.setupTsconfigMissingWithParent({
        searchPath: '/project/src',
        parentPath: '/project',
      });
      proxy.setupTsconfigFound({ searchPath: '/project' });

      const result = await locationsTsconfigPathFindBroker({
        startPath: FilePathStub({ value: '/project/src/sub' }),
      });

      expect(result).toBe(AbsoluteFilePathStub({ value: '/project/tsconfig.json' }));
    });
  });

  describe('tsconfig not found cases', () => {
    it('ERROR: {startPath: "/no-config"} => throws ProjectRootNotFoundError when nothing up the tree', async () => {
      const proxy = locationsTsconfigPathFindBrokerProxy();

      proxy.setupTsconfigNotFound({ searchPath: '/no-config' });

      await expect(
        locationsTsconfigPathFindBroker({
          startPath: FilePathStub({ value: '/no-config' }),
        }),
      ).rejects.toThrow(ProjectRootNotFoundError);
    });
  });
});
