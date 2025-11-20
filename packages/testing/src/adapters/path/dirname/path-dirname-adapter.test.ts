import { pathDirnameAdapter } from './path-dirname-adapter';
import { pathDirnameAdapterProxy } from './path-dirname-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('pathDirnameAdapter', () => {
  describe('valid paths', () => {
    it('VALID: {filePath: "/tmp/test/file.txt"} => returns "/tmp/test"', () => {
      pathDirnameAdapterProxy();
      const filePath = '/tmp/test/file.txt';

      const result = pathDirnameAdapter({ filePath });

      expect(result).toStrictEqual(FilePathStub({ value: '/tmp/test' }));
    });

    it('VALID: {filePath: "/tmp/file.txt"} => returns "/tmp"', () => {
      pathDirnameAdapterProxy();
      const filePath = '/tmp/file.txt';

      const result = pathDirnameAdapter({ filePath });

      expect(result).toStrictEqual(FilePathStub({ value: '/tmp' }));
    });

    it('VALID: {filePath: "/file.txt"} => returns "/"', () => {
      pathDirnameAdapterProxy();
      const filePath = '/file.txt';

      const result = pathDirnameAdapter({ filePath });

      expect(result).toStrictEqual(FilePathStub({ value: '/' }));
    });
  });
});
