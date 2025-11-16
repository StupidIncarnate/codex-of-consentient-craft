import { pathJoinAdapter } from './path-join-adapter';
import { pathJoinAdapterProxy } from './path-join-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('pathJoinAdapter', () => {
  describe('successful operations', () => {
    it('VALID: {paths: ["path", "to", "file.txt"]} => returns joined path', () => {
      const proxy = pathJoinAdapterProxy();
      const paths = [
        FilePathStub({ value: 'path' }),
        FilePathStub({ value: 'to' }),
        FilePathStub({ value: 'file.txt' }),
      ];
      const expectedResult = FilePathStub({ value: 'path/to/file.txt' });

      proxy.returns({ result: expectedResult });

      const result = pathJoinAdapter({ paths });

      expect(result).toStrictEqual(expectedResult);
    });

    it('VALID: {paths: ["/absolute", "relative"]} => returns joined absolute path', () => {
      const proxy = pathJoinAdapterProxy();
      const paths = [FilePathStub({ value: '/absolute' }), FilePathStub({ value: 'relative' })];
      const expectedResult = FilePathStub({ value: '/absolute/relative' });

      proxy.returns({ result: expectedResult });

      const result = pathJoinAdapter({ paths });

      expect(result).toStrictEqual(expectedResult);
    });

    it('VALID: {paths: ["..", "parent", "file"]} => returns joined path with parent navigation', () => {
      const proxy = pathJoinAdapterProxy();
      const paths = [
        FilePathStub({ value: '..' }),
        FilePathStub({ value: 'parent' }),
        FilePathStub({ value: 'file' }),
      ];
      const expectedResult = FilePathStub({ value: '../parent/file' });

      proxy.returns({ result: expectedResult });

      const result = pathJoinAdapter({ paths });

      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {paths: []} => returns empty or current directory path', () => {
      const proxy = pathJoinAdapterProxy();
      const paths: ReturnType<typeof FilePathStub>[] = [];
      const expectedResult = FilePathStub({ value: '.' });

      proxy.returns({ result: expectedResult });

      const result = pathJoinAdapter({ paths });

      expect(result).toStrictEqual(expectedResult);
    });

    it('EDGE: {paths: ["single"]} => returns single path element', () => {
      const proxy = pathJoinAdapterProxy();
      const paths = [FilePathStub({ value: 'single' })];
      const expectedResult = FilePathStub({ value: 'single' });

      proxy.returns({ result: expectedResult });

      const result = pathJoinAdapter({ paths });

      expect(result).toStrictEqual(expectedResult);
    });

    it('EDGE: {paths: [".", "empty", ".", "segments"]} => returns path with dot segments', () => {
      const proxy = pathJoinAdapterProxy();
      const paths = [
        FilePathStub({ value: '.' }),
        FilePathStub({ value: 'empty' }),
        FilePathStub({ value: '.' }),
        FilePathStub({ value: 'segments' }),
      ];
      const expectedResult = FilePathStub({ value: 'empty/segments' });

      proxy.returns({ result: expectedResult });

      const result = pathJoinAdapter({ paths });

      expect(result).toStrictEqual(expectedResult);
    });

    it('EDGE: {paths: [".", "..", "complex/navigation"]} => returns normalized path', () => {
      const proxy = pathJoinAdapterProxy();
      const paths = [
        FilePathStub({ value: '.' }),
        FilePathStub({ value: '..' }),
        FilePathStub({ value: 'complex/navigation' }),
      ];
      const expectedResult = FilePathStub({ value: '../complex/navigation' });

      proxy.returns({ result: expectedResult });

      const result = pathJoinAdapter({ paths });

      expect(result).toStrictEqual(expectedResult);
    });
  });
});
