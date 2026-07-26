import { discoverPackagesLayerBroker } from './discover-packages-layer-broker';
import { discoverPackagesLayerBrokerProxy } from './discover-packages-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('discoverPackagesLayerBroker', () => {
  describe('monorepo detection', () => {
    it('VALID: existing packages directory => returns entries from adapter', () => {
      const proxy = discoverPackagesLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/repo/packages' });
      proxy.setupPackages({ dirPath, entries: [] });

      const result = discoverPackagesLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });

  describe('single-package fallback', () => {
    it('ERROR: missing packages directory => returns empty array (single-root signal)', () => {
      const proxy = discoverPackagesLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/single-repo/packages' });
      proxy.setupMissingPackagesDir({ dirPath });

      const result = discoverPackagesLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });
});
