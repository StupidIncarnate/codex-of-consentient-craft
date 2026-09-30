import { discoverPackagesLayerBroker } from './discover-packages-layer-broker';
import { discoverPackagesLayerBrokerProxy } from './discover-packages-layer-broker.proxy';

describe('discoverPackagesLayerBroker', () => {
  describe('plain packages', () => {
    it('VALID: {cli, shared directories} => returns each by its own name and relativeDir', () => {
      const proxy = discoverPackagesLayerBrokerProxy();
      const dirPath = '/repo/packages';
      proxy.setupPackages({
        dirPath,
        entries: [
          { name: 'cli', isDirectory: true },
          { name: 'shared', isDirectory: true },
          { name: 'CLAUDE.md', isDirectory: false },
        ],
      });

      const result = discoverPackagesLayerBroker({ dirPath });

      expect(result).toStrictEqual([
        { name: 'cli', relativeDir: 'cli' },
        { name: 'shared', relativeDir: 'shared' },
      ]);
    });

    it('VALID: {empty packages directory} => returns empty array', () => {
      const proxy = discoverPackagesLayerBrokerProxy();
      const dirPath = '/repo/packages';
      proxy.setupPackages({ dirPath, entries: [] });

      const result = discoverPackagesLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });

  describe('@-scoped group folders', () => {
    it('VALID: {@gateway group holding npm and node} => lists the children by bare name with a relativeDir under the group, and does not list @gateway itself', () => {
      const proxy = discoverPackagesLayerBrokerProxy();
      const dirPath = '/repo/packages';
      proxy.setupPackages({
        dirPath,
        entries: [
          { name: 'cli', isDirectory: true },
          { name: '@gateway', isDirectory: true },
        ],
      });
      proxy.setupGroupFolder({
        dirPath,
        groupName: '@gateway',
        entries: [
          { name: 'npm', isDirectory: true },
          { name: 'node', isDirectory: true },
        ],
      });

      const result = discoverPackagesLayerBroker({ dirPath });

      expect(result).toStrictEqual([
        { name: 'cli', relativeDir: 'cli' },
        { name: 'npm', relativeDir: '@gateway/npm' },
        { name: 'node', relativeDir: '@gateway/node' },
      ]);
    });

    it('VALID: {group folder holding a non-directory entry} => omits it from the expanded children', () => {
      const proxy = discoverPackagesLayerBrokerProxy();
      const dirPath = '/repo/packages';
      proxy.setupPackages({ dirPath, entries: [{ name: '@gateway', isDirectory: true }] });
      proxy.setupGroupFolder({
        dirPath,
        groupName: '@gateway',
        entries: [
          { name: 'npm', isDirectory: true },
          { name: 'README.md', isDirectory: false },
        ],
      });

      const result = discoverPackagesLayerBroker({ dirPath });

      expect(result).toStrictEqual([{ name: 'npm', relativeDir: '@gateway/npm' }]);
    });
  });

  describe('single-package fallback', () => {
    it('ERROR: missing packages directory => returns empty array (single-root signal)', () => {
      const proxy = discoverPackagesLayerBrokerProxy();
      const dirPath = '/single-repo/packages';
      proxy.setupMissingPackagesDir({ dirPath });

      const result = discoverPackagesLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });
});
