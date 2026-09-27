import { readFileIfExists } from './read-file-if-exists';
import { readFileIfExistsProxy } from './read-file-if-exists.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('readFileIfExists', () => {
  describe('successful reads', () => {
    it('VALID: {path: existing file} => returns its contents', async () => {
      const proxy = readFileIfExistsProxy();
      proxy.returns({ path: '/repo/.dungeonmaster.json', contents: '{"port":3737}' });

      const result = await readFileIfExists('/repo/.dungeonmaster.json');

      expect(result).toBe('{"port":3737}');
    });

    it('EMPTY: {path: an empty file} => returns an empty string, distinct from null', async () => {
      const proxy = readFileIfExistsProxy();
      proxy.returns({ path: '/repo/.dungeonmaster.json', contents: '' });

      const result = await readFileIfExists('/repo/.dungeonmaster.json');

      expect(result).toBe('');
    });
  });

  describe('missing path', () => {
    it('EMPTY: {path: missing} => returns null instead of throwing', async () => {
      const proxy = readFileIfExistsProxy();
      proxy.missing({ path: '/repo/missing.json' });

      const result = await readFileIfExists('/repo/missing.json');

      expect(result).toBe(null);
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = readFileIfExistsProxy();
      proxy.denied({ path: '/repo/locked.json' });

      await expect(readFileIfExists('/repo/locked.json')).rejects.toStrictEqual(
        FsErrorStub({ code: 'EACCES', path: '/repo/locked.json' }),
      );
    });

    it('ERROR: {path: a directory} => rejects with the raw EISDIR error', async () => {
      const proxy = readFileIfExistsProxy();
      proxy.isDirectory({ path: '/repo/quests' });

      await expect(readFileIfExists('/repo/quests')).rejects.toStrictEqual(
        FsErrorStub({ code: 'EISDIR', path: '/repo/quests' }),
      );
    });

    it('ERROR: {path: a parent segment that is a file} => rejects with the raw ENOTDIR error', async () => {
      const proxy = readFileIfExistsProxy();
      proxy.notADirectory({ path: '/repo/.dungeonmaster.json/nested' });

      await expect(readFileIfExists('/repo/.dungeonmaster.json/nested')).rejects.toStrictEqual(
        FsErrorStub({ code: 'ENOTDIR', path: '/repo/.dungeonmaster.json/nested' }),
      );
    });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPath, a predicate} => resolves for a path the predicate accepts', async () => {
      const proxy = readFileIfExistsProxy();
      proxy.returnsMatchingPath({
        path: (value) => String(value).endsWith('quest.json'),
        contents: '{"port":3737}',
      });

      const result = await readFileIfExists('/resolved/at/runtime/quest.json');

      expect(result).toBe('{"port":3737}');
    });

    it('ERROR: {throwsMatchingPath, a predicate} => rejects with the staged error', async () => {
      const proxy = readFileIfExistsProxy();
      const error = FsErrorStub({ code: 'EACCES', path: '/resolved/at/runtime/locked.json' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('locked.json'),
        error,
      });

      await expect(readFileIfExists('/resolved/at/runtime/locked.json')).rejects.toStrictEqual(
        error,
      );
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', async () => {
      const proxy = readFileIfExistsProxy();
      proxy.returns({ path: '/repo/.dungeonmaster.json', contents: '{"port":3737}' });

      await readFileIfExists('/repo/.dungeonmaster.json');

      expect(proxy.getCallsFor({ path: '/repo/.dungeonmaster.json' })).toStrictEqual([
        ['/repo/.dungeonmaster.json', 'utf8'],
      ]);
    });
  });
});
