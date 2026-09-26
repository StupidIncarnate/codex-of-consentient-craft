import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { gatewayPackageNamesReadLayerBroker } from './gateway-package-names-read-layer-broker';
import { gatewayPackageNamesReadLayerBrokerProxy } from './gateway-package-names-read-layer-broker.proxy';

describe('gatewayPackageNamesReadLayerBroker', () => {
  describe('valid inputs', () => {
    it('VALID: {only packages/node exists} => returns node, leaves bin and browser absent', async () => {
      const rootPath = FilePathStub({ value: '/repo' });
      const proxy = gatewayPackageNamesReadLayerBrokerProxy({ rootPath });
      proxy.setupPackageJson({ folderName: 'node', name: '@dungeonmaster/node' });

      const result = await gatewayPackageNamesReadLayerBroker({ rootPath });

      expect(result).toStrictEqual({ node: '@dungeonmaster/node' });
    });

    it('VALID: {all three gateway packages exist} => returns all three names', async () => {
      const rootPath = FilePathStub({ value: '/repo' });
      const proxy = gatewayPackageNamesReadLayerBrokerProxy({ rootPath });
      proxy.setupPackageJson({ folderName: 'node', name: '@dungeonmaster/node' });
      proxy.setupPackageJson({ folderName: 'bin', name: '@dungeonmaster/bin' });
      proxy.setupPackageJson({ folderName: 'browser', name: '@dungeonmaster/browser' });

      const result = await gatewayPackageNamesReadLayerBroker({ rootPath });

      expect(result).toStrictEqual({
        node: '@dungeonmaster/node',
        bin: '@dungeonmaster/bin',
        browser: '@dungeonmaster/browser',
      });
    });
  });

  describe('empty input', () => {
    it('EMPTY: {none of the gateway packages exist} => returns an object with every field absent', async () => {
      const rootPath = FilePathStub({ value: '/repo' });
      gatewayPackageNamesReadLayerBrokerProxy({ rootPath });

      const result = await gatewayPackageNamesReadLayerBroker({ rootPath });

      expect(result).toStrictEqual({});
    });
  });
});
