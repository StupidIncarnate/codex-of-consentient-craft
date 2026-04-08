import { formatFolderContentLayerBroker } from './format-folder-content-layer-broker';
import { formatFolderContentLayerBrokerProxy } from './format-folder-content-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { FolderConfigStub } from '../../../contracts/folder-config/folder-config.stub';

describe('formatFolderContentLayerBroker', () => {
  describe('depth 0 — file names', () => {
    it('VALID: startup folder with files => lists file stems without extensions', () => {
      const proxy = formatFolderContentLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/project/src/startup' });
      const { folderDepth } = FolderConfigStub({ folderDepth: 0 });

      proxy.setupDepth0Files({ fileNames: ['start-app.ts', 'start-server.ts'] });

      const result = formatFolderContentLayerBroker({ dirPath, folderDepth });

      expect(result).toBe('start-app, start-server');
    });
  });

  describe('depth 1 — subdirectory names', () => {
    it('VALID: contracts folder with subdirs => lists subdirectory names', () => {
      const proxy = formatFolderContentLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/project/src/contracts' });
      const { folderDepth } = FolderConfigStub({ folderDepth: 1 });

      proxy.setupDepth1Subdirs({ subdirNames: ['chat-entry', 'quest-id', 'user-input'] });

      const result = formatFolderContentLayerBroker({ dirPath, folderDepth });

      expect(result).toBe('chat-entry, quest-id, user-input');
    });

    it('VALID: folder with many subdirs => lists all without truncation', () => {
      const proxy = formatFolderContentLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/project/src/contracts' });
      const { folderDepth } = FolderConfigStub({ folderDepth: 1 });

      proxy.setupDepth1Subdirs({
        subdirNames: [
          'alpha',
          'bravo',
          'charlie',
          'delta',
          'echo',
          'foxtrot',
          'golf',
          'hotel',
          'india',
          'juliet',
          'kilo',
        ],
      });

      const result = formatFolderContentLayerBroker({ dirPath, folderDepth });

      expect(result).toBe(
        'alpha, bravo, charlie, delta, echo, foxtrot, golf, hotel, india, juliet, kilo',
      );
    });
  });

  describe('depth 2 — domain/action pairs', () => {
    it('VALID: brokers folder with domains and actions => lists domain (action1, action2) pairs', () => {
      const proxy = formatFolderContentLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/project/src/brokers' });
      const { folderDepth } = FolderConfigStub({ folderDepth: 2 });

      proxy.setupDepth2Domains({
        domains: [
          { name: 'guild', actions: ['create', 'detail', 'list'] },
          { name: 'quest', actions: ['modify', 'start'] },
        ],
      });

      const result = formatFolderContentLayerBroker({ dirPath, folderDepth });

      expect(result).toBe('guild (create, detail, list), quest (modify, start)');
    });

    it('VALID: domain with no actions => lists domain name only', () => {
      const proxy = formatFolderContentLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/project/src/brokers' });
      const { folderDepth } = FolderConfigStub({ folderDepth: 2 });

      proxy.setupDepth2Domains({
        domains: [{ name: 'empty-domain', actions: [] }],
      });

      const result = formatFolderContentLayerBroker({ dirPath, folderDepth });

      expect(result).toBe('empty-domain');
    });
  });

  describe('empty folder', () => {
    it('EMPTY: empty folder => returns empty string', () => {
      const proxy = formatFolderContentLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/project/src/empty' });
      const { folderDepth } = FolderConfigStub({ folderDepth: 1 });

      proxy.setupEmpty();

      const result = formatFolderContentLayerBroker({ dirPath, folderDepth });

      expect(result).toBe('');
    });
  });
});
