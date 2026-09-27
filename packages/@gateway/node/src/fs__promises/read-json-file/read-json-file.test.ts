import { readJsonFile } from './read-json-file';
import { readJsonFileProxy } from './read-json-file.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('readJsonFile', () => {
  describe('successful reads', () => {
    it('VALID: {path: valid JSON file} => returns the parsed value', async () => {
      const proxy = readJsonFileProxy();
      proxy.returnsRaw({ path: '/repo/.dungeonmaster.json', rawContents: '{"port":3737}' });

      const result = await readJsonFile('/repo/.dungeonmaster.json');

      expect(result).toStrictEqual({ port: 3737 });
    });
  });

  describe('invalid content', () => {
    it('INVALID: {path: malformed JSON} => throws a SyntaxError naming the path', async () => {
      const proxy = readJsonFileProxy();
      proxy.returnsRaw({ path: '/repo/.dungeonmaster.json', rawContents: '{not json' });

      await expect(readJsonFile('/repo/.dungeonmaster.json')).rejects.toStrictEqual(
        new SyntaxError('Invalid JSON in /repo/.dungeonmaster.json'),
      );
    });

    it('EMPTY: {path: an empty file} => throws a SyntaxError, because empty is not JSON', async () => {
      const proxy = readJsonFileProxy();
      proxy.returnsRaw({ path: '/repo/.dungeonmaster.json', rawContents: '' });

      await expect(readJsonFile('/repo/.dungeonmaster.json')).rejects.toStrictEqual(
        new SyntaxError('Invalid JSON in /repo/.dungeonmaster.json'),
      );
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: missing} => rejects with the raw ENOENT error', async () => {
      const proxy = readJsonFileProxy();
      proxy.missing({ path: '/repo/missing.json' });

      await expect(readJsonFile('/repo/missing.json')).rejects.toStrictEqual(
        FsErrorStub({ code: 'ENOENT', path: '/repo/missing.json' }),
      );
    });

    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = readJsonFileProxy();
      proxy.denied({ path: '/repo/locked.json' });

      await expect(readJsonFile('/repo/locked.json')).rejects.toStrictEqual(
        FsErrorStub({ code: 'EACCES', path: '/repo/locked.json' }),
      );
    });

    it('ERROR: {path: a directory} => rejects with the raw EISDIR error', async () => {
      const proxy = readJsonFileProxy();
      proxy.isDirectory({ path: '/repo/quests' });

      await expect(readJsonFile('/repo/quests')).rejects.toStrictEqual(
        FsErrorStub({ code: 'EISDIR', path: '/repo/quests' }),
      );
    });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsRawMatchingPath, a predicate} => resolves for a path the predicate accepts', async () => {
      const proxy = readJsonFileProxy();
      proxy.returnsRawMatchingPath({
        path: (value) => String(value).endsWith('.dungeonmaster.json'),
        rawContents: '{"port":3737}',
      });

      const result = await readJsonFile('/resolved/at/runtime/.dungeonmaster.json');

      expect(result).toStrictEqual({ port: 3737 });
    });

    it('ERROR: {throwsMatchingPath, a predicate} => rejects with the staged error', async () => {
      const proxy = readJsonFileProxy();
      const error = FsErrorStub({ code: 'ENOENT', path: '/resolved/at/runtime/missing.json' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('missing.json'),
        error,
      });

      await expect(readJsonFile('/resolved/at/runtime/missing.json')).rejects.toStrictEqual(error);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', async () => {
      const proxy = readJsonFileProxy();
      proxy.returnsRaw({ path: '/repo/.dungeonmaster.json', rawContents: '{"port":3737}' });

      await readJsonFile('/repo/.dungeonmaster.json');

      expect(proxy.getCallsFor({ path: '/repo/.dungeonmaster.json' })).toStrictEqual([
        ['/repo/.dungeonmaster.json', 'utf8'],
      ]);
    });
  });
});
