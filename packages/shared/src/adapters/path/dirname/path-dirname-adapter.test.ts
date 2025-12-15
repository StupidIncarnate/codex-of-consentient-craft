import { pathDirnameAdapter } from './path-dirname-adapter';
import { pathDirnameAdapterProxy } from './path-dirname-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('pathDirnameAdapter', () => {
  describe('valid paths', () => {
    it('VALID: {path: "/project/src/file.ts"} => returns "/project/src"', () => {
      const proxy = pathDirnameAdapterProxy();
      const path = FilePathStub({ value: '/project/src/file.ts' });

      proxy.returns({ result: FilePathStub({ value: '/project/src' }) });

      const result = pathDirnameAdapter({ path });

      expect(result).toBe('/project/src');
    });

    it('VALID: {path: "/file.ts"} => returns "/"', () => {
      const proxy = pathDirnameAdapterProxy();
      const path = FilePathStub({ value: '/file.ts' });

      proxy.returns({ result: FilePathStub({ value: '/' }) });

      const result = pathDirnameAdapter({ path });

      expect(result).toBe('/');
    });
  });
});
