import { collectFolderFilesLayerBroker } from './collect-folder-files-layer-broker';
import { collectFolderFilesLayerBrokerProxy } from './collect-folder-files-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('collectFolderFilesLayerBroker', () => {
  describe('file collection', () => {
    it('VALID: {directory with source files} => returns all non-test files', () => {
      const proxy = collectFolderFilesLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/repo/packages/web/src/responders' });

      proxy.setupFlatDirectory({
        filePaths: [
          AbsoluteFilePathStub({ value: '/repo/packages/web/src/responders/app-responder.ts' }),
          AbsoluteFilePathStub({ value: '/repo/packages/web/src/responders/another-responder.ts' }),
        ],
      });

      const result = collectFolderFilesLayerBroker({ dirPath });

      expect(result).toStrictEqual([
        '/repo/packages/web/src/responders/app-responder.ts',
        '/repo/packages/web/src/responders/another-responder.ts',
      ]);
    });

    it('VALID: {test files in directory} => filters test files out', () => {
      const proxy = collectFolderFilesLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/repo/packages/web/src/responders' });

      proxy.setupFlatDirectory({
        filePaths: [
          AbsoluteFilePathStub({
            value: '/repo/packages/web/src/responders/app-responder.test.ts',
          }),
        ],
      });

      const result = collectFolderFilesLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {missing directory} => returns empty array', () => {
      const proxy = collectFolderFilesLayerBrokerProxy();
      proxy.setupEmpty();

      const dirPath = AbsoluteFilePathStub({ value: '/repo/packages/web/src/flows' });
      const result = collectFolderFilesLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });
});
