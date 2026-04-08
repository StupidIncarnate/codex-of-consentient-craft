import { fsReadFileSyncAdapter } from './fs-read-file-sync-adapter';
import { fsReadFileSyncAdapterProxy } from './fs-read-file-sync-adapter.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('fsReadFileSyncAdapter', () => {
  describe('file exists', () => {
    it('VALID: {filePath: existing file} => returns file contents', () => {
      const proxy = fsReadFileSyncAdapterProxy();

      proxy.returns({ content: ContentTextStub({ value: '{"name": "test"}' }) });

      const result = fsReadFileSyncAdapter({
        filePath: AbsoluteFilePathStub({ value: '/path/to/file.json' }),
      });

      expect(result).toStrictEqual(ContentTextStub({ value: '{"name": "test"}' }));
    });
  });

  describe('file does not exist', () => {
    it('VALID: {filePath: non-existing file} => throws error', () => {
      const proxy = fsReadFileSyncAdapterProxy();

      proxy.throws({ error: new Error('ENOENT') });

      expect(() =>
        fsReadFileSyncAdapter({
          filePath: AbsoluteFilePathStub({ value: '/path/to/missing.json' }),
        }),
      ).toThrow('ENOENT');
    });
  });
});
