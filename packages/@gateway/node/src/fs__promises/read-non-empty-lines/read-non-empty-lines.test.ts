import { readNonEmptyLines } from './read-non-empty-lines';
import { readNonEmptyLinesProxy } from './read-non-empty-lines.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('readNonEmptyLines', () => {
  describe('successful reads', () => {
    it('VALID: {path: file with a trailing newline} => returns each line, dropping the trailing empty split', async () => {
      const proxy = readNonEmptyLinesProxy();
      proxy.returnsRaw({
        path: '/home/user/.claude/sessions/abc.jsonl',
        rawContents: '{"a":1}\n{"b":2}\n',
      });

      const result = await readNonEmptyLines('/home/user/.claude/sessions/abc.jsonl');

      expect(result).toStrictEqual(['{"a":1}', '{"b":2}']);
    });

    it('EDGE: {path: file with a torn last line} => keeps the partial line', async () => {
      const proxy = readNonEmptyLinesProxy();
      proxy.returnsRaw({
        path: '/home/user/.claude/sessions/abc.jsonl',
        rawContents: '{"a":1}\n{"b":2',
      });

      const result = await readNonEmptyLines('/home/user/.claude/sessions/abc.jsonl');

      expect(result).toStrictEqual(['{"a":1}', '{"b":2']);
    });
  });

  describe('empty file', () => {
    it('EMPTY: {path: an empty file} => returns an empty array', async () => {
      const proxy = readNonEmptyLinesProxy();
      proxy.returnsRaw({ path: '/home/user/.claude/sessions/empty.jsonl', rawContents: '' });

      const result = await readNonEmptyLines('/home/user/.claude/sessions/empty.jsonl');

      expect(result).toStrictEqual([]);
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: missing} => rejects with the raw ENOENT error', async () => {
      const proxy = readNonEmptyLinesProxy();
      proxy.missing({ path: '/home/user/.claude/sessions/missing.jsonl' });

      await expect(
        readNonEmptyLines('/home/user/.claude/sessions/missing.jsonl'),
      ).rejects.toStrictEqual(
        FsErrorStub({ code: 'ENOENT', path: '/home/user/.claude/sessions/missing.jsonl' }),
      );
    });

    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = readNonEmptyLinesProxy();
      proxy.denied({ path: '/home/user/.claude/sessions/locked.jsonl' });

      await expect(
        readNonEmptyLines('/home/user/.claude/sessions/locked.jsonl'),
      ).rejects.toStrictEqual(
        FsErrorStub({ code: 'EACCES', path: '/home/user/.claude/sessions/locked.jsonl' }),
      );
    });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsRawMatchingPath, a predicate} => resolves for a path the predicate accepts', async () => {
      const proxy = readNonEmptyLinesProxy();
      proxy.returnsRawMatchingPath({
        path: (value) => String(value).endsWith('abc.jsonl'),
        rawContents: '{"a":1}\n{"b":2}\n',
      });

      const result = await readNonEmptyLines('/resolved/at/runtime/abc.jsonl');

      expect(result).toStrictEqual(['{"a":1}', '{"b":2}']);
    });

    it('ERROR: {throwsMatchingPath, a predicate} => rejects with the staged error', async () => {
      const proxy = readNonEmptyLinesProxy();
      const error = FsErrorStub({ code: 'ENOENT', path: '/resolved/at/runtime/missing.jsonl' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('missing.jsonl'),
        error,
      });

      await expect(readNonEmptyLines('/resolved/at/runtime/missing.jsonl')).rejects.toStrictEqual(
        error,
      );
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', async () => {
      const proxy = readNonEmptyLinesProxy();
      proxy.returnsRaw({
        path: '/home/user/.claude/sessions/abc.jsonl',
        rawContents: '{"a":1}\n',
      });

      await readNonEmptyLines('/home/user/.claude/sessions/abc.jsonl');

      expect(proxy.getCallsFor({ path: '/home/user/.claude/sessions/abc.jsonl' })).toStrictEqual([
        ['/home/user/.claude/sessions/abc.jsonl', 'utf8'],
      ]);
    });
  });
});
