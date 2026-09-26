import { findPackageJsonDirLayerBroker } from './find-package-json-dir-layer-broker';
import { findPackageJsonDirLayerBrokerProxy } from './find-package-json-dir-layer-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

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
      proxy.setupPackageJsonAt({ dirPath: '/repo/packages/node' });

      const result = findPackageJsonDirLayerBroker({
        startDir: FilePathStub({ value: '/repo/packages/node/src/fs' }),
      });

      expect(result).toBe('/repo/packages/node');
    });
  });

  describe('package.json not found', () => {
    it('EMPTY: {no ancestor holds package.json} => returns undefined', () => {
      findPackageJsonDirLayerBrokerProxy();

      const result = findPackageJsonDirLayerBroker({
        startDir: FilePathStub({ value: '/repo/packages/node/src/fs' }),
      });

      expect(result).toBe(undefined);
    });
  });
});
