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
});
