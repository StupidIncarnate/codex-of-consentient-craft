import { discoverPackagesLayerBroker } from './discover-packages-layer-broker';
import { discoverPackagesLayerBrokerProxy } from './discover-packages-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('discoverPackagesLayerBroker', () => {
  describe('monorepo detection', () => {
    it('VALID: existing packages directory => returns entries from adapter', () => {
      const proxy = discoverPackagesLayerBrokerProxy();
      proxy.setupPackages({ entries: [] });

      const result = discoverPackagesLayerBroker({
        dirPath: AbsoluteFilePathStub({ value: '/repo/packages' }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('single-package fallback', () => {
    it('ERROR: missing packages directory => returns empty array (single-root signal)', () => {
      const proxy = discoverPackagesLayerBrokerProxy();
      proxy.setupMissingPackagesDir();

      const result = discoverPackagesLayerBroker({
        dirPath: AbsoluteFilePathStub({ value: '/single-repo/packages' }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
