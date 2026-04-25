import { locationsNodeModulesBinPathFindBroker } from './locations-node-modules-bin-path-find-broker';
import { locationsNodeModulesBinPathFindBrokerProxy } from './locations-node-modules-bin-path-find-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('locationsNodeModulesBinPathFindBroker', () => {
  describe('binary path resolution', () => {
    it('VALID: {rootPath: "/repo", binName: "jest"} => returns /repo/node_modules/.bin/jest', () => {
      const proxy = locationsNodeModulesBinPathFindBrokerProxy();

      proxy.setupBinPath({
        binPath: FilePathStub({ value: '/repo/node_modules/.bin/jest' }),
      });

      const result = locationsNodeModulesBinPathFindBroker({
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
        binName: FileNameStub({ value: 'jest' }),
      });

      expect(result).toBe(AbsoluteFilePathStub({ value: '/repo/node_modules/.bin/jest' }));
    });

    it('VALID: {rootPath: "/repo/packages/web", binName: "tsc"} => resolves workspace-local bin', () => {
      const proxy = locationsNodeModulesBinPathFindBrokerProxy();

      proxy.setupBinPath({
        binPath: FilePathStub({ value: '/repo/packages/web/node_modules/.bin/tsc' }),
      });

      const result = locationsNodeModulesBinPathFindBroker({
        rootPath: AbsoluteFilePathStub({ value: '/repo/packages/web' }),
        binName: FileNameStub({ value: 'tsc' }),
      });

      expect(result).toBe(
        AbsoluteFilePathStub({ value: '/repo/packages/web/node_modules/.bin/tsc' }),
      );
    });
  });
});
