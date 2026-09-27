import { readFileBytes } from './read-file-bytes';
import { readFileBytesProxy } from './read-file-bytes.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('readFileBytes', () => {
  describe('successful reads', () => {
    it('VALID: {path: existing binary file} => returns its raw bytes', async () => {
      const proxy = readFileBytesProxy();
      const bytes = new Uint8Array([137, 80, 78, 71]);
      proxy.returns({ path: '/repo/.dungeonmaster-assets/step7.png', bytes });

      const result = await readFileBytes('/repo/.dungeonmaster-assets/step7.png');

      expect(result).toStrictEqual(bytes);
    });

    it('EMPTY: {path: an empty file} => returns an empty byte array', async () => {
      const proxy = readFileBytesProxy();
      const bytes = new Uint8Array([]);
      proxy.returns({ path: '/repo/.dungeonmaster-assets/empty.png', bytes });

      const result = await readFileBytes('/repo/.dungeonmaster-assets/empty.png');

      expect(result).toStrictEqual(bytes);
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: missing} => rejects with the raw ENOENT error', async () => {
      const proxy = readFileBytesProxy();
      const error = FsErrorStub({ code: 'ENOENT' });
      proxy.rejects({ path: '/repo/missing.png', error });

      await expect(readFileBytes('/repo/missing.png')).rejects.toBe(error);
    });

    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = readFileBytesProxy();
      const error = FsErrorStub({ code: 'EACCES' });
      proxy.rejects({ path: '/repo/locked.png', error });

      await expect(readFileBytes('/repo/locked.png')).rejects.toBe(error);
    });

    it('ERROR: {path: a directory} => rejects with the raw EISDIR error', async () => {
      const proxy = readFileBytesProxy();
      const error = FsErrorStub({ code: 'EISDIR' });
      proxy.rejects({ path: '/repo/assets', error });

      await expect(readFileBytes('/repo/assets')).rejects.toBe(error);
    });

    it('ERROR: {path: a parent segment that is a file} => rejects with the raw ENOTDIR error', async () => {
      const proxy = readFileBytesProxy();
      const error = FsErrorStub({ code: 'ENOTDIR' });
      proxy.rejects({ path: '/repo/step7.png/nested', error });

      await expect(readFileBytes('/repo/step7.png/nested')).rejects.toBe(error);
    });
  });
});
