import { readFileFromOffset } from './read-file-from-offset';
import { readFileFromOffsetProxy } from './read-file-from-offset.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('readFileFromOffset', () => {
  describe('successful reads', () => {
    it('VALID: {fromByte: within the file} => returns the bytes from that offset onward', async () => {
      const proxy = readFileFromOffsetProxy();
      const fullContents = 'line one\nline two\nline three';
      const fromByte = 9;
      proxy.returns({
        path: '/home/user/.claude/sessions/abc.jsonl',
        size: fullContents.length,
        contents: fullContents.slice(fromByte),
      });

      const result = await readFileFromOffset({
        path: '/home/user/.claude/sessions/abc.jsonl',
        fromByte,
      });

      expect(result).toBe('line two\nline three');
    });

    it('EDGE: {fromByte: past the end of the file} => returns an empty string', async () => {
      const proxy = readFileFromOffsetProxy();
      proxy.returns({
        path: '/home/user/.claude/sessions/abc.jsonl',
        size: 10,
        contents: '',
      });

      const result = await readFileFromOffset({
        path: '/home/user/.claude/sessions/abc.jsonl',
        fromByte: 100,
      });

      expect(result).toBe('');
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: missing} => rejects with the raw ENOENT error', async () => {
      const proxy = readFileFromOffsetProxy();
      proxy.missing({ path: '/home/user/.claude/sessions/missing.jsonl' });

      await expect(
        readFileFromOffset({ path: '/home/user/.claude/sessions/missing.jsonl', fromByte: 0 }),
      ).rejects.toStrictEqual(
        FsErrorStub({ code: 'ENOENT', path: '/home/user/.claude/sessions/missing.jsonl' }),
      );
    });

    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = readFileFromOffsetProxy();
      proxy.denied({ path: '/home/user/.claude/sessions/locked.jsonl' });

      await expect(
        readFileFromOffset({ path: '/home/user/.claude/sessions/locked.jsonl', fromByte: 0 }),
      ).rejects.toStrictEqual(
        FsErrorStub({ code: 'EACCES', path: '/home/user/.claude/sessions/locked.jsonl' }),
      );
    });

    it('ERROR: {path: a directory} => rejects with the raw EISDIR error', async () => {
      const proxy = readFileFromOffsetProxy();
      proxy.isDirectory({ path: '/home/user/.claude/sessions' });

      await expect(
        readFileFromOffset({ path: '/home/user/.claude/sessions', fromByte: 0 }),
      ).rejects.toStrictEqual(FsErrorStub({ code: 'EISDIR', path: '/home/user/.claude/sessions' }));
    });
  });
});
