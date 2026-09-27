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
      const error = FsErrorStub({ code: 'ENOENT' });
      proxy.rejects({ path: '/repo/missing.json', error });

      await expect(readFile('/repo/missing.json')).rejects.toBe(error);
    });

    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = readFileProxy();
      const error = FsErrorStub({ code: 'EACCES' });
      proxy.rejects({ path: '/repo/locked.json', error });

      await expect(readFile('/repo/locked.json')).rejects.toBe(error);
    });

    it('ERROR: {path: a directory} => rejects with the raw EISDIR error', async () => {
      const proxy = readFileProxy();
      const error = FsErrorStub({ code: 'EISDIR' });
      proxy.rejects({ path: '/repo/quests', error });

      await expect(readFile('/repo/quests')).rejects.toBe(error);
    });

    it('ERROR: {path: a parent segment that is a file} => rejects with the raw ENOTDIR error', async () => {
      const proxy = readFileProxy();
      const error = FsErrorStub({ code: 'ENOTDIR' });
      proxy.rejects({ path: '/repo/.dungeonmaster.json/nested', error });

      await expect(readFile('/repo/.dungeonmaster.json/nested')).rejects.toBe(error);
    });
  });
});
