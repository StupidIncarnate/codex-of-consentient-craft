import { readJsonFileIfExists } from './read-json-file-if-exists';
import { readJsonFileIfExistsProxy } from './read-json-file-if-exists.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('readJsonFileIfExists', () => {
  describe('successful reads', () => {
    it('VALID: {path: valid JSON file} => returns the parsed value', async () => {
      const proxy = readJsonFileIfExistsProxy();
      proxy.returnsRaw({ path: '/repo/.dungeonmaster.json', rawContents: '{"port":3737}' });

      const result = await readJsonFileIfExists('/repo/.dungeonmaster.json');

      expect(result).toStrictEqual({ port: 3737 });
    });
  });

  describe('missing path', () => {
    it('EMPTY: {path: missing} => returns null instead of throwing', async () => {
      const proxy = readJsonFileIfExistsProxy();
      proxy.missing({ path: '/repo/missing.json' });

      const result = await readJsonFileIfExists('/repo/missing.json');

      expect(result).toBe(null);
    });
  });

  describe('invalid content', () => {
    it('INVALID: {path: malformed JSON} => throws a SyntaxError naming the path', async () => {
      const proxy = readJsonFileIfExistsProxy();
      proxy.returnsRaw({ path: '/repo/.dungeonmaster.json', rawContents: '{not json' });

      await expect(readJsonFileIfExists('/repo/.dungeonmaster.json')).rejects.toStrictEqual(
        new SyntaxError('Invalid JSON in /repo/.dungeonmaster.json'),
      );
    });

    it('EMPTY: {path: an empty file} => throws a SyntaxError, not null', async () => {
      const proxy = readJsonFileIfExistsProxy();
      proxy.returnsRaw({ path: '/repo/.dungeonmaster.json', rawContents: '' });

      await expect(readJsonFileIfExists('/repo/.dungeonmaster.json')).rejects.toStrictEqual(
        new SyntaxError('Invalid JSON in /repo/.dungeonmaster.json'),
      );
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = readJsonFileIfExistsProxy();
      proxy.denied({ path: '/repo/locked.json' });

      await expect(readJsonFileIfExists('/repo/locked.json')).rejects.toStrictEqual(
        FsErrorStub({ code: 'EACCES', path: '/repo/locked.json', syscall: 'open' }),
      );
    });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsRawMatchingPath, a predicate} => resolves for a path the predicate accepts', async () => {
      const proxy = readJsonFileIfExistsProxy();
      proxy.returnsRawMatchingPath({
        path: (value) => String(value).endsWith('settings.json'),
        rawContents: '{"port":3737}',
      });

      const result = await readJsonFileIfExists('/resolved/at/runtime/settings.json');

      expect(result).toStrictEqual({ port: 3737 });
    });

    it('ERROR: {throwsMatchingPath, a predicate} => rejects with the staged error', async () => {
      const proxy = readJsonFileIfExistsProxy();
      const error = FsErrorStub({ code: 'EACCES', path: '/resolved/at/runtime/locked.json' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('locked.json'),
        error,
      });

      await expect(readJsonFileIfExists('/resolved/at/runtime/locked.json')).rejects.toStrictEqual(
        error,
      );
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', async () => {
      const proxy = readJsonFileIfExistsProxy();
      proxy.returnsRaw({ path: '/repo/.dungeonmaster.json', rawContents: '{"port":3737}' });

      await readJsonFileIfExists('/repo/.dungeonmaster.json');

      expect(proxy.getCallsFor({ path: '/repo/.dungeonmaster.json' })).toStrictEqual([
        ['/repo/.dungeonmaster.json', 'utf8'],
      ]);
    });
  });
});
