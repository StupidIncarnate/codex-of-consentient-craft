import { pathDirnameAdapter } from './path-dirname-adapter';
import { pathDirnameAdapterProxy } from './path-dirname-adapter.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('pathDirnameAdapter', () => {
  describe('successful operations', () => {
    it('VALID: {filePath: "/project/src/file.ts"} => returns parent directory', () => {
      const proxy = pathDirnameAdapterProxy();
      const filePath = FilePathStub({ value: '/project/src/file.ts' });
      const expectedResult = FilePathStub({ value: '/project/src' });

      proxy.returns({ filePath, result: expectedResult });

      const result = pathDirnameAdapter({ filePath });

      expect(result).toStrictEqual(expectedResult);
    });

    it('VALID: {filePath: "/"} => returns root itself', () => {
      const proxy = pathDirnameAdapterProxy();
      const filePath = FilePathStub({ value: '/' });
      const expectedResult = FilePathStub({ value: '/' });

      proxy.returns({ filePath, result: expectedResult });

      const result = pathDirnameAdapter({ filePath });

      expect(result).toStrictEqual(expectedResult);
    });
  });
});
