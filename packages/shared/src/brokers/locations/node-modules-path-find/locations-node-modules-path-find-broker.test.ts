import { locationsNodeModulesPathFindBroker } from './locations-node-modules-path-find-broker';
import { locationsNodeModulesPathFindBrokerProxy } from './locations-node-modules-path-find-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('locationsNodeModulesPathFindBroker', () => {
  describe('node_modules path resolution', () => {
    it('VALID: {rootPath: "/repo"} => returns /repo/node_modules', () => {
      const proxy = locationsNodeModulesPathFindBrokerProxy();

      proxy.setupNodeModulesPath({
        nodeModulesPath: FilePathStub({ value: '/repo/node_modules' }),
      });

      const result = locationsNodeModulesPathFindBroker({
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(result).toBe(AbsoluteFilePathStub({ value: '/repo/node_modules' }));
    });

    it('VALID: {rootPath: "/repo/worktrees/add-auth-7bc217a1"} => resolves worktree-local node_modules', () => {
      const proxy = locationsNodeModulesPathFindBrokerProxy();

      proxy.setupNodeModulesPath({
        nodeModulesPath: FilePathStub({
          value: '/repo/worktrees/add-auth-7bc217a1/node_modules',
        }),
      });

      const result = locationsNodeModulesPathFindBroker({
        rootPath: AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' }),
      });

      expect(result).toBe(
        AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1/node_modules' }),
      );
    });
  });
});
