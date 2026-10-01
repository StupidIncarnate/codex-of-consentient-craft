import { subfolderPathsListLayerBroker } from './subfolder-paths-list-layer-broker';
import { subfolderPathsListLayerBrokerProxy } from './subfolder-paths-list-layer-broker.proxy';

describe('subfolderPathsListLayerBroker', () => {
  describe('valid input', () => {
    it('VALID: {folders and files} => returns only the folders as absolute paths', () => {
      const proxy = subfolderPathsListLayerBrokerProxy();
      const dirPath = '/repo/packages';
      proxy.setupDirectory({ dirPath, folders: ['shared', '@gateway'], files: ['CLAUDE.md'] });

      const result = subfolderPathsListLayerBroker({ dirPath });

      expect(result).toStrictEqual(['/repo/packages/shared', '/repo/packages/@gateway']);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no entries} => returns an empty list', () => {
      const proxy = subfolderPathsListLayerBrokerProxy();
      const dirPath = '/repo/packages';
      proxy.setupDirectory({ dirPath, folders: [], files: [] });

      const result = subfolderPathsListLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });
});
