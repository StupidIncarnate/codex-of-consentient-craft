import { listStaticsFoldersLayerBroker } from './list-statics-folders-layer-broker';
import { listStaticsFoldersLayerBrokerProxy } from './list-statics-folders-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/shared' });

describe('listStaticsFoldersLayerBroker', () => {
  describe('missing statics directory', () => {
    it('EMPTY: {missing statics dir} => returns empty array', () => {
      const proxy = listStaticsFoldersLayerBrokerProxy();
      proxy.setupMissing();

      const result = listStaticsFoldersLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('statics directory with folders', () => {
    it('VALID: {3 static folders} => returns all folder names', () => {
      const proxy = listStaticsFoldersLayerBrokerProxy();
      proxy.setupFolders({ folderNames: ['project-map', 'mcp-tools', 'locations'] });

      const result = listStaticsFoldersLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result.map(String)).toStrictEqual(['project-map', 'mcp-tools', 'locations']);
    });

    it('EMPTY: {no folders} => returns empty array', () => {
      const proxy = listStaticsFoldersLayerBrokerProxy();
      proxy.setupFolders({ folderNames: [] });

      const result = listStaticsFoldersLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual([]);
    });
  });
});
