import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsReadFileRangeAdapter } from './fs-read-file-range-adapter';
import { fsReadFileRangeAdapterProxy } from './fs-read-file-range-adapter.proxy';

const PATH = FilePathStub({ value: '/home/user/.claude/projects/p/session.jsonl' });

describe('fsReadFileRangeAdapter', () => {
  describe('reading a tail', () => {
    it('VALID: {fromByte: 0} => returns the whole file', async () => {
      const proxy = fsReadFileRangeAdapterProxy();
      proxy.setupFile({ filePath: PATH, contents: 'first\nsecond\n' });

      const result = await fsReadFileRangeAdapter({ filePath: PATH, fromByte: 0 });

      expect(result).toBe('first\nsecond\n');
    });

    it('VALID: {fromByte past the first line} => returns only what came after it', async () => {
      const proxy = fsReadFileRangeAdapterProxy();
      proxy.setupFile({ filePath: PATH, contents: 'first\nsecond\n' });

      const result = await fsReadFileRangeAdapter({ filePath: PATH, fromByte: 6 });

      expect(result).toBe('second\n');
    });

    it('EDGE: {fromByte exactly at the end} => returns empty', async () => {
      const proxy = fsReadFileRangeAdapterProxy();
      proxy.setupFile({ filePath: PATH, contents: 'first\n' });

      const result = await fsReadFileRangeAdapter({ filePath: PATH, fromByte: 6 });

      expect(result).toBe('');
    });

    it('EDGE: {fromByte past the end} => returns empty rather than a negative-length read', async () => {
      const proxy = fsReadFileRangeAdapterProxy();
      proxy.setupFile({ filePath: PATH, contents: 'first\n' });

      const result = await fsReadFileRangeAdapter({ filePath: PATH, fromByte: 9_000 });

      expect(result).toBe('');
    });

    it('EMPTY: {an empty file} => returns empty', async () => {
      const proxy = fsReadFileRangeAdapterProxy();
      proxy.setupFile({ filePath: PATH, contents: '' });

      const result = await fsReadFileRangeAdapter({ filePath: PATH, fromByte: 0 });

      expect(result).toBe('');
    });
  });

  describe('failures', () => {
    it('ERROR: {the file cannot be opened} => rejects with the open error', async () => {
      const proxy = fsReadFileRangeAdapterProxy();
      proxy.setupOpenFailure({
        filePath: PATH,
        error: new Error('ENOENT: no such file or directory'),
      });

      await expect(fsReadFileRangeAdapter({ filePath: PATH, fromByte: 0 })).rejects.toThrow(
        /ENOENT/u,
      );
    });
  });
});
