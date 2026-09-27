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
      proxy.missing({ path: '/repo/missing.png' });

      await expect(readFileBytes('/repo/missing.png')).rejects.toStrictEqual(
        FsErrorStub({ code: 'ENOENT', path: '/repo/missing.png' }),
      );
    });

    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = readFileBytesProxy();
      proxy.denied({ path: '/repo/locked.png' });

      await expect(readFileBytes('/repo/locked.png')).rejects.toStrictEqual(
        FsErrorStub({ code: 'EACCES', path: '/repo/locked.png' }),
      );
    });

    it('ERROR: {path: a directory} => rejects with the raw EISDIR error', async () => {
      const proxy = readFileBytesProxy();
      proxy.isDirectory({ path: '/repo/assets' });

      await expect(readFileBytes('/repo/assets')).rejects.toStrictEqual(
        FsErrorStub({ code: 'EISDIR', path: '/repo/assets' }),
      );
    });

    it('ERROR: {path: a parent segment that is a file} => rejects with the raw ENOTDIR error', async () => {
      const proxy = readFileBytesProxy();
      proxy.notADirectory({ path: '/repo/step7.png/nested' });

      await expect(readFileBytes('/repo/step7.png/nested')).rejects.toStrictEqual(
        FsErrorStub({ code: 'ENOTDIR', path: '/repo/step7.png/nested' }),
      );
    });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPath, a predicate} => resolves for a path the predicate accepts', async () => {
      const proxy = readFileBytesProxy();
      const bytes = new Uint8Array([137, 80, 78, 71]);
      proxy.returnsMatchingPath({
        path: (value) => String(value).endsWith('step7.png'),
        bytes,
      });

      const result = await readFileBytes('/resolved/at/runtime/step7.png');

      expect(result).toStrictEqual(bytes);
    });

    it('ERROR: {throwsMatchingPath, a predicate} => rejects with the staged error', async () => {
      const proxy = readFileBytesProxy();
      const error = FsErrorStub({ code: 'ENOENT', path: '/resolved/at/runtime/missing.png' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('missing.png'),
        error,
      });

      await expect(readFileBytes('/resolved/at/runtime/missing.png')).rejects.toStrictEqual(error);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', async () => {
      const proxy = readFileBytesProxy();
      const bytes = new Uint8Array([137, 80, 78, 71]);
      proxy.returns({ path: '/repo/.dungeonmaster-assets/step7.png', bytes });

      await readFileBytes('/repo/.dungeonmaster-assets/step7.png');

      expect(proxy.getCallsFor({ path: '/repo/.dungeonmaster-assets/step7.png' })).toStrictEqual([
        ['/repo/.dungeonmaster-assets/step7.png'],
      ]);
    });
  });
});
