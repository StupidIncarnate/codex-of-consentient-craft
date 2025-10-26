import { fsReadFileAdapter } from './fs-read-file-adapter';
import { fsReadFileAdapterProxy } from './fs-read-file-adapter.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { SourceCodeStub } from '../../../contracts/source-code/source-code.stub';

describe('fsReadFileAdapter', () => {
  describe('valid inputs', () => {
    it('VALID: {filePath: "/file.ts"} => returns source code', async () => {
      const adapterProxy = fsReadFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/file.ts' });
      const sourceCode = SourceCodeStub({ value: 'const x = 1;' });

      adapterProxy.returns({ filePath, sourceCode });

      const result = await fsReadFileAdapter({ filePath });

      expect(result).toBe('const x = 1;');
    });

    it('VALID: {filePath: "/empty.ts"} => returns empty source code', async () => {
      const adapterProxy = fsReadFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/empty.ts' });
      const sourceCode = SourceCodeStub({ value: '' });

      adapterProxy.returns({ filePath, sourceCode });

      const result = await fsReadFileAdapter({ filePath });

      expect(result).toBe('');
    });
  });

  describe('file system errors', () => {
    it('ERROR: {filePath: "/missing.ts"} => throws file not found error', async () => {
      const adapterProxy = fsReadFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/missing.ts' });
      const error = new Error('ENOENT: no such file or directory');

      adapterProxy.throws({ filePath, error });

      await expect(fsReadFileAdapter({ filePath })).rejects.toThrow(
        'ENOENT: no such file or directory',
      );
    });

    it('ERROR: {filePath: "/denied.ts"} => throws permission denied error', async () => {
      const adapterProxy = fsReadFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/denied.ts' });
      const error = new Error('EACCES: permission denied');

      adapterProxy.throws({ filePath, error });

      await expect(fsReadFileAdapter({ filePath })).rejects.toThrow('EACCES: permission denied');
    });

    it('ERROR: {filePath: "/dir"} => throws is directory error', async () => {
      const adapterProxy = fsReadFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/dir' });
      const error = new Error('EISDIR: illegal operation on a directory');

      adapterProxy.throws({ filePath, error });

      await expect(fsReadFileAdapter({ filePath })).rejects.toThrow(
        'EISDIR: illegal operation on a directory',
      );
    });

    it('ERROR: {filePath: "/symlink"} => throws broken symlink error', async () => {
      const adapterProxy = fsReadFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/symlink' });
      const error = new Error('ELOOP: too many symbolic links encountered');

      adapterProxy.throws({ filePath, error });

      await expect(fsReadFileAdapter({ filePath })).rejects.toThrow(
        'ELOOP: too many symbolic links encountered',
      );
    });

    it('ERROR: {filePath: "/locked.ts"} => throws file busy error', async () => {
      const adapterProxy = fsReadFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/locked.ts' });
      const error = new Error('EBUSY: resource busy or locked');

      adapterProxy.throws({ filePath, error });

      await expect(fsReadFileAdapter({ filePath })).rejects.toThrow(
        'EBUSY: resource busy or locked',
      );
    });

    it('ERROR: {filePath: "/invalid-encoding.ts"} => throws invalid encoding error', async () => {
      const adapterProxy = fsReadFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/invalid-encoding.ts' });
      const error = new Error('EILSEQ: invalid or incomplete multibyte or wide character');

      adapterProxy.throws({ filePath, error });

      await expect(fsReadFileAdapter({ filePath })).rejects.toThrow(
        'EILSEQ: invalid or incomplete multibyte or wide character',
      );
    });

    it('ERROR: {filePath: "/very/long/path/name/that/exceeds/system/limits.ts"} => throws name too long error', async () => {
      const adapterProxy = fsReadFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/very/long/path/name/that/exceeds/system/limits.ts',
      });
      const error = new Error('ENAMETOOLONG: name too long');

      adapterProxy.throws({ filePath, error });

      await expect(fsReadFileAdapter({ filePath })).rejects.toThrow('ENAMETOOLONG: name too long');
    });
  });

  describe('content edge cases', () => {
    it('VALID: {filePath: "/large.ts"} => returns large file content', async () => {
      const adapterProxy = fsReadFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/large.ts' });
      const largeContent = 'const x = 1;\n'.repeat(100000);
      const sourceCode = SourceCodeStub({ value: largeContent });

      adapterProxy.returns({ filePath, sourceCode });

      const result = await fsReadFileAdapter({ filePath });

      expect(result).toBe(largeContent);
    });

    it('VALID: {filePath: "/unicode.ts"} => returns unicode content', async () => {
      const adapterProxy = fsReadFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/unicode.ts' });
      const sourceCode = SourceCodeStub({
        value: 'const emoji = "🚀"; const chinese = "你好世界";',
      });

      adapterProxy.returns({ filePath, sourceCode });

      const result = await fsReadFileAdapter({ filePath });

      expect(result).toBe('const emoji = "🚀"; const chinese = "你好世界";');
    });

    it('VALID: {filePath: "/special-chars.ts"} => returns special character content', async () => {
      const adapterProxy = fsReadFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/special-chars.ts' });
      const sourceCode = SourceCodeStub({
        value: 'const str = "\\n\\t\\r\\"\\\\";\nconst path = "C:\\\\path\\\\to\\\\file";',
      });

      adapterProxy.returns({ filePath, sourceCode });

      const result = await fsReadFileAdapter({ filePath });

      expect(result).toBe(
        'const str = "\\n\\t\\r\\"\\\\";\nconst path = "C:\\\\path\\\\to\\\\file";',
      );
    });

    it('VALID: {filePath: "/whitespace.ts"} => returns whitespace only content', async () => {
      const adapterProxy = fsReadFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/whitespace.ts' });
      const sourceCode = SourceCodeStub({ value: '   \n\t\r\n   ' });

      adapterProxy.returns({ filePath, sourceCode });

      const result = await fsReadFileAdapter({ filePath });

      expect(result).toBe('   \n\t\r\n   ');
    });

    it('VALID: {filePath: "/single-char.ts"} => returns single character content', async () => {
      const adapterProxy = fsReadFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/single-char.ts' });
      const sourceCode = SourceCodeStub({ value: 'x' });

      adapterProxy.returns({ filePath, sourceCode });

      const result = await fsReadFileAdapter({ filePath });

      expect(result).toBe('x');
    });
  });
});
