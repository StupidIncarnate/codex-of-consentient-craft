import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { gatewayDependencyNamesReadLayerBroker } from './gateway-dependency-names-read-layer-broker';
import { gatewayDependencyNamesReadLayerBrokerProxy } from './gateway-dependency-names-read-layer-broker.proxy';

describe('gatewayDependencyNamesReadLayerBroker', () => {
  describe('valid inputs', () => {
    it('VALID: {one gateway folder with dependencies and peerDependencies} => returns the deduped, sorted union', async () => {
      const proxy = gatewayDependencyNamesReadLayerBrokerProxy();
      const folder = ProjectFolderStub({
        name: '@dungeonmaster/npm',
        path: '/repo/packages/@gateway/npm',
      });
      proxy.setupPackageJson({
        folder,
        dependencies: { '@mantine/core': '^8.0.0', zod: '^3.25.76' },
        peerDependencies: { typescript: '^5.8.3' },
      });

      const result = await gatewayDependencyNamesReadLayerBroker({ gatewayFolders: [folder] });

      expect(result).toStrictEqual(['@mantine/core', 'typescript', 'zod']);
    });

    it('VALID: {two gateway folders sharing a dependency} => unions names across folders without duplicates', async () => {
      const proxy = gatewayDependencyNamesReadLayerBrokerProxy();
      const npmFolder = ProjectFolderStub({
        name: '@dungeonmaster/npm',
        path: '/repo/packages/@gateway/npm',
      });
      const binFolder = ProjectFolderStub({
        name: '@dungeonmaster/bin',
        path: '/repo/packages/@gateway/bin',
      });
      proxy.setupPackageJson({ folder: npmFolder, dependencies: { zod: '^3.25.76' } });
      proxy.setupPackageJson({
        folder: binFolder,
        dependencies: { zod: '^3.25.76', glob: '^10.3.10' },
      });

      const result = await gatewayDependencyNamesReadLayerBroker({
        gatewayFolders: [npmFolder, binFolder],
      });

      expect(result).toStrictEqual(['glob', 'zod']);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no gateway folders} => returns an empty array', async () => {
      gatewayDependencyNamesReadLayerBrokerProxy();

      const result = await gatewayDependencyNamesReadLayerBroker({ gatewayFolders: [] });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {gateway folder with neither dependencies nor peerDependencies} => returns an empty array', async () => {
      const proxy = gatewayDependencyNamesReadLayerBrokerProxy();
      const folder = ProjectFolderStub({
        name: '@dungeonmaster/node',
        path: '/repo/packages/@gateway/node',
      });
      proxy.setupPackageJson({ folder });

      const result = await gatewayDependencyNamesReadLayerBroker({ gatewayFolders: [folder] });

      expect(result).toStrictEqual([]);
    });
  });
});
