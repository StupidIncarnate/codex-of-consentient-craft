import { pathDirnameAdapter } from './path-dirname-adapter';
import { pathDirnameAdapterProxy } from './path-dirname-adapter.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('pathDirnameAdapter', () => {
  describe('successful operations', () => {
    it('VALID: {path: "/path/to/file.txt"} => returns "/path/to"', () => {
      const proxy = pathDirnameAdapterProxy();
      const path = FilePathStub({ value: '/path/to/file.txt' });
      const expectedResult = FilePathStub({ value: '/path/to' });

      proxy.returns({ result: expectedResult });

      const result = pathDirnameAdapter({ path });

      expect(result).toStrictEqual(expectedResult);
    });

    it('VALID: {path: "./relative/file.js"} => returns "./relative"', () => {
      const proxy = pathDirnameAdapterProxy();
      const path = FilePathStub({ value: './relative/file.js' });
      const expectedResult = FilePathStub({ value: './relative' });

      proxy.returns({ result: expectedResult });

      const result = pathDirnameAdapter({ path });

      expect(result).toStrictEqual(expectedResult);
    });

    it('VALID: {path: "/root/single/file"} => returns "/root/single"', () => {
      const proxy = pathDirnameAdapterProxy();
      const path = FilePathStub({ value: '/root/single/file' });
      const expectedResult = FilePathStub({ value: '/root/single' });

      proxy.returns({ result: expectedResult });

      const result = pathDirnameAdapter({ path });

      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {path: "/"} => returns "/"', () => {
      const proxy = pathDirnameAdapterProxy();
      const path = FilePathStub({ value: '/' });
      const expectedResult = FilePathStub({ value: '/' });

      proxy.returns({ result: expectedResult });

      const result = pathDirnameAdapter({ path });

      expect(result).toStrictEqual(expectedResult);
    });

    it('EDGE: {path: "./file.txt"} => returns current directory', () => {
      const proxy = pathDirnameAdapterProxy();
      const path = FilePathStub({ value: './file.txt' });
      const expectedResult = FilePathStub({ value: './' });

      proxy.returns({ result: expectedResult });

      const result = pathDirnameAdapter({ path });

      expect(result).toStrictEqual(expectedResult);
    });

    it('EDGE: {path: "./"} => returns current directory', () => {
      const proxy = pathDirnameAdapterProxy();
      const path = FilePathStub({ value: './' });
      const expectedResult = FilePathStub({ value: './' });

      proxy.returns({ result: expectedResult });

      const result = pathDirnameAdapter({ path });

      expect(result).toStrictEqual(expectedResult);
    });
  });
});
