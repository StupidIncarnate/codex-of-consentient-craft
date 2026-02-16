import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';

import { projectFolderDiscoverLayerReadBroker } from './project-folder-discover-layer-read-broker';
import { projectFolderDiscoverLayerReadBrokerProxy } from './project-folder-discover-layer-read-broker.proxy';

describe('projectFolderDiscoverLayerReadBroker', () => {
  describe('valid package.json', () => {
    it('VALID: {package.json with name field} => returns ProjectFolder', async () => {
      const proxy = projectFolderDiscoverLayerReadBrokerProxy();
      proxy.setupReturnsContent({ content: JSON.stringify({ name: '@dungeonmaster/ward' }) });

      const result = await projectFolderDiscoverLayerReadBroker({
        relativePath: 'packages/ward/package.json',
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(
        ProjectFolderStub({ name: '@dungeonmaster/ward', path: '/project/packages/ward' }),
      );
    });

    it('VALID: {root package.json} => returns ProjectFolder with root path', async () => {
      const proxy = projectFolderDiscoverLayerReadBrokerProxy();
      proxy.setupReturnsContent({ content: JSON.stringify({ name: 'dungeonmaster' }) });

      const result = await projectFolderDiscoverLayerReadBroker({
        relativePath: 'package.json',
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(ProjectFolderStub({ name: 'dungeonmaster', path: '/project' }));
    });
  });

  describe('missing name', () => {
    it('EMPTY: {package.json without name field} => returns null', async () => {
      const proxy = projectFolderDiscoverLayerReadBrokerProxy();
      proxy.setupReturnsContent({ content: JSON.stringify({ version: '1.0.0' }) });

      const result = await projectFolderDiscoverLayerReadBroker({
        relativePath: 'packages/ward/package.json',
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBeNull();
    });
  });

  describe('invalid JSON', () => {
    it('ERROR: {malformed package.json} => returns null', async () => {
      const proxy = projectFolderDiscoverLayerReadBrokerProxy();
      proxy.setupReturnsContent({ content: 'not json' });

      const result = await projectFolderDiscoverLayerReadBroker({
        relativePath: 'packages/ward/package.json',
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBeNull();
    });
  });

  describe('read failure', () => {
    it('ERROR: {file read throws} => returns null', async () => {
      const proxy = projectFolderDiscoverLayerReadBrokerProxy();
      proxy.setupThrows();

      const result = await projectFolderDiscoverLayerReadBroker({
        relativePath: 'packages/ward/package.json',
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBeNull();
    });
  });

  describe('non-object JSON', () => {
    it('EDGE: {package.json is array} => returns null', async () => {
      const proxy = projectFolderDiscoverLayerReadBrokerProxy();
      proxy.setupReturnsContent({ content: JSON.stringify([1, 2, 3]) });

      const result = await projectFolderDiscoverLayerReadBroker({
        relativePath: 'packages/ward/package.json',
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBeNull();
    });
  });
});
