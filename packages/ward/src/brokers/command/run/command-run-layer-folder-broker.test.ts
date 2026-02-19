import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { commandRunLayerFolderBroker } from './command-run-layer-folder-broker';
import { commandRunLayerFolderBrokerProxy } from './command-run-layer-folder-broker.proxy';

describe('commandRunLayerFolderBroker', () => {
  describe('valid package.json', () => {
    it('VALID: {package.json has name} => returns ProjectFolder with package name', async () => {
      const proxy = commandRunLayerFolderBrokerProxy();
      proxy.setupReturnsPackage({ name: '@dungeonmaster/ward' });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await commandRunLayerFolderBroker({ rootPath });

      expect(result).toStrictEqual({
        name: '@dungeonmaster/ward',
        path: '/project',
      });
    });
  });

  describe('missing package.json', () => {
    it('EDGE: {no package.json} => returns ProjectFolder with path as name fallback', async () => {
      const proxy = commandRunLayerFolderBrokerProxy();
      proxy.setupThrows();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });

      const result = await commandRunLayerFolderBroker({ rootPath });

      expect(result).toStrictEqual({
        name: '/project',
        path: '/project',
      });
    });
  });
});
