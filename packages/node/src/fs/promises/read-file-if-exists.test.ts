import { readFileIfExists } from './read-file-if-exists';
import { readFileIfExistsProxy } from './read-file-if-exists.proxy';
import { FsErrorStub } from '../fs-error.stub';

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
      const error = FsErrorStub({ code: 'EACCES' });
      proxy.rejects({ path: '/repo/locked.json', error });

      await expect(readFileIfExists('/repo/locked.json')).rejects.toBe(error);
    });

    it('ERROR: {path: a directory} => rejects with the raw EISDIR error', async () => {
      const proxy = readFileIfExistsProxy();
      const error = FsErrorStub({ code: 'EISDIR' });
      proxy.rejects({ path: '/repo/quests', error });

      await expect(readFileIfExists('/repo/quests')).rejects.toBe(error);
    });

    it('ERROR: {path: a parent segment that is a file} => rejects with the raw ENOTDIR error', async () => {
      const proxy = readFileIfExistsProxy();
      const error = FsErrorStub({ code: 'ENOTDIR' });
      proxy.rejects({ path: '/repo/.dungeonmaster.json/nested', error });

      await expect(readFileIfExists('/repo/.dungeonmaster.json/nested')).rejects.toBe(error);
    });
  });
});
