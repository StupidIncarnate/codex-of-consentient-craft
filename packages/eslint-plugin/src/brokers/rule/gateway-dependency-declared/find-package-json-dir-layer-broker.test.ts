import { findPackageJsonDirLayerBroker } from './find-package-json-dir-layer-broker';
import { findPackageJsonDirLayerBrokerProxy } from './find-package-json-dir-layer-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';

describe('findPackageJsonDirLayerBroker', () => {
  describe('package.json found', () => {
    it('VALID: {startDir holds package.json} => returns startDir itself', () => {
      const proxy = findPackageJsonDirLayerBrokerProxy();
      proxy.setupPackageJsonAt({ dirPath: '/repo/packages/node' });

      const result = findPackageJsonDirLayerBroker({
        startDir: FilePathStub({ value: '/repo/packages/node' }),
      });

      expect(result).toBe('/repo/packages/node');
    });

    it('VALID: {package.json several levels up} => returns the ancestor holding it', () => {
      const proxy = findPackageJsonDirLayerBrokerProxy();
      proxy.setupNoPackageJsonAt({ dirPath: '/repo/packages/node/src/fs' });
      proxy.setupNoPackageJsonAt({ dirPath: '/repo/packages/node/src' });
      proxy.setupPackageJsonAt({ dirPath: '/repo/packages/node' });

      const result = findPackageJsonDirLayerBroker({
        startDir: FilePathStub({ value: '/repo/packages/node/src/fs' }),
      });

      expect(result).toBe('/repo/packages/node');
    });
  });

  describe('package.json not found', () => {
    it('EMPTY: {no ancestor holds package.json} => returns undefined', () => {
      const proxy = findPackageJsonDirLayerBrokerProxy();
      proxy.setupNoPackageJsonAt({ dirPath: '/repo/packages/node/src/fs' });
      proxy.setupNoPackageJsonAt({ dirPath: '/repo/packages/node/src' });
      proxy.setupNoPackageJsonAt({ dirPath: '/repo/packages/node' });
      proxy.setupNoPackageJsonAt({ dirPath: '/repo/packages' });
      proxy.setupNoPackageJsonAt({ dirPath: '/repo' });
      proxy.setupNoPackageJsonAt({ dirPath: '/' });

      const result = findPackageJsonDirLayerBroker({
        startDir: FilePathStub({ value: '/repo/packages/node/src/fs' }),
      });

      expect(result).toBe(undefined);
    });
  });
});
