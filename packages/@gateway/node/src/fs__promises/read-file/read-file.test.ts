import { readFile } from './read-file';
import { readFileProxy } from './read-file.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('readFile', () => {
  describe('successful reads', () => {
    it('VALID: {path: existing file} => returns its contents', async () => {
      const proxy = readFileProxy();
      proxy.returns({ path: '/repo/.dungeonmaster.json', contents: '{"port":3737}' });

      const result = await readFile('/repo/.dungeonmaster.json');

      expect(result).toBe('{"port":3737}');
    });

    it('EMPTY: {path: an empty file} => returns an empty string', async () => {
      const proxy = readFileProxy();
      proxy.returns({ path: '/repo/.dungeonmaster.json', contents: '' });

      const result = await readFile('/repo/.dungeonmaster.json');

      expect(result).toBe('');
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: missing} => rejects with the raw ENOENT error', async () => {
      const proxy = readFileProxy();
      proxy.missing({ path: '/repo/missing.json' });

      await expect(readFile('/repo/missing.json')).rejects.toStrictEqual(
        FsErrorStub({ code: 'ENOENT', path: '/repo/missing.json' }),
      );
    });

    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = readFileProxy();
      proxy.denied({ path: '/repo/locked.json' });

      await expect(readFile('/repo/locked.json')).rejects.toStrictEqual(
        FsErrorStub({ code: 'EACCES', path: '/repo/locked.json' }),
      );
    });

    it('ERROR: {path: a directory} => rejects with the raw EISDIR error', async () => {
      const proxy = readFileProxy();
      proxy.isDirectory({ path: '/repo/quests' });

      await expect(readFile('/repo/quests')).rejects.toStrictEqual(
        FsErrorStub({ code: 'EISDIR', path: '/repo/quests' }),
      );
    });

    it('ERROR: {path: a parent segment that is a file} => rejects with the raw ENOTDIR error', async () => {
      const proxy = readFileProxy();
      proxy.notADirectory({ path: '/repo/.dungeonmaster.json/nested' });

      await expect(readFile('/repo/.dungeonmaster.json/nested')).rejects.toStrictEqual(
        FsErrorStub({ code: 'ENOTDIR', path: '/repo/.dungeonmaster.json/nested' }),
      );
    });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPath, a predicate} => resolves for a path the predicate accepts', async () => {
      const proxy = readFileProxy();
      proxy.returnsMatchingPath({
        path: (value) => String(value).endsWith('quest.json'),
        contents: '{"port":3737}',
      });

      const result = await readFile('/resolved/at/runtime/quest.json');

      expect(result).toBe('{"port":3737}');
    });

    it('ERROR: {throwsMatchingPath, a predicate} => rejects with the staged error', async () => {
      const proxy = readFileProxy();
      const error = FsErrorStub({ code: 'ENOENT', path: '/resolved/at/runtime/missing.json' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('missing.json'),
        error,
      });

      await expect(readFile('/resolved/at/runtime/missing.json')).rejects.toStrictEqual(error);
    });
  });

  describe('one-shot staging', () => {
    it('VALID: {returnsOnce twice for one path} => answers each read in the order staged', async () => {
      const proxy = readFileProxy();
      proxy.returnsOnce({ path: '/repo/quest.json', contents: 'first' });
      proxy.returnsOnce({ path: '/repo/quest.json', contents: 'second' });

      const results = [await readFile('/repo/quest.json'), await readFile('/repo/quest.json')];

      expect(results).toStrictEqual(['first', 'second']);
    });

    it('VALID: {returns, then returnsOnce for one path} => the one-shot answers first, then returns takes over', async () => {
      const proxy = readFileProxy();
      proxy.returns({ path: '/repo/quest.json', contents: 'sticky' });
      proxy.returnsOnce({ path: '/repo/quest.json', contents: 'once' });

      const results = [
        await readFile('/repo/quest.json'),
        await readFile('/repo/quest.json'),
        await readFile('/repo/quest.json'),
      ];

      expect(results).toStrictEqual(['once', 'sticky', 'sticky']);
    });

    it('ERROR: {throwsOnce, then returnsOnce for one path} => rejects the first read and answers the second', async () => {
      const proxy = readFileProxy();
      const error = FsErrorStub({ code: 'ENOENT', path: '/repo/quest.json' });
      proxy.throwsOnce({ path: '/repo/quest.json', error });
      proxy.returnsOnce({ path: '/repo/quest.json', contents: 'written by now' });

      await expect(readFile('/repo/quest.json')).rejects.toStrictEqual(error);
      await expect(readFile('/repo/quest.json')).resolves.toBe('written by now');
    });

    it('VALID: {returnsOnce, a predicate} => answers a path the predicate accepts', async () => {
      const proxy = readFileProxy();
      proxy.returnsOnce({
        path: (value) => String(value).endsWith('quest.json'),
        contents: '{"id":"q1"}',
      });

      const result = await readFile('/resolved/at/runtime/quest.json');

      expect(result).toBe('{"id":"q1"}');
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', async () => {
      const proxy = readFileProxy();
      proxy.returns({ path: '/repo/.dungeonmaster.json', contents: '{"port":3737}' });

      await readFile('/repo/.dungeonmaster.json');

      expect(proxy.getCallsFor({ path: '/repo/.dungeonmaster.json' })).toStrictEqual([
        ['/repo/.dungeonmaster.json', 'utf8'],
      ]);
    });
  });
});
