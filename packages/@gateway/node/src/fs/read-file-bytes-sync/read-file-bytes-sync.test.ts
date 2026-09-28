import { readFileBytesSync } from './read-file-bytes-sync';
import { readFileBytesSyncProxy } from './read-file-bytes-sync.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

describe('readFileBytesSync', () => {
  describe('successful reads', () => {
    it('VALID: {path: existing binary file} => returns its raw bytes as a Buffer', () => {
      const proxy = readFileBytesSyncProxy();
      const bytes = Buffer.from([137, 80, 78, 71]);
      proxy.returns({ path: '/repo/.dungeonmaster-assets/step7.png', bytes });

      const result = readFileBytesSync('/repo/.dungeonmaster-assets/step7.png');

      expect(result).toStrictEqual(bytes);
    });

    it('EMPTY: {path: an empty file} => returns an empty buffer', () => {
      const proxy = readFileBytesSyncProxy();
      const bytes = Buffer.from([]);
      proxy.returns({ path: '/repo/.dungeonmaster-assets/empty.png', bytes });

      const result = readFileBytesSync('/repo/.dungeonmaster-assets/empty.png');

      expect(result).toStrictEqual(bytes);
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: missing} => throws the raw ENOENT error', () => {
      const proxy = readFileBytesSyncProxy();
      const expectedError = FsErrorStub({ code: 'ENOENT', path: '/repo/missing.png' });
      proxy.missing({ path: '/repo/missing.png' });

      expect(() => readFileBytesSync('/repo/missing.png')).toThrow(expectedError);
    });

    it('ERROR: {path: permission denied} => throws the raw EACCES error', () => {
      const proxy = readFileBytesSyncProxy();
      const expectedError = FsErrorStub({ code: 'EACCES', path: '/repo/locked.png' });
      proxy.denied({ path: '/repo/locked.png' });

      expect(() => readFileBytesSync('/repo/locked.png')).toThrow(expectedError);
    });

    it('ERROR: {path: a directory} => throws the raw EISDIR error', () => {
      const proxy = readFileBytesSyncProxy();
      const expectedError = FsErrorStub({ code: 'EISDIR', path: '/repo/assets' });
      proxy.isDirectory({ path: '/repo/assets' });

      expect(() => readFileBytesSync('/repo/assets')).toThrow(expectedError);
    });

    it('ERROR: {path: a parent segment that is a file} => throws the raw ENOTDIR error', () => {
      const proxy = readFileBytesSyncProxy();
      const expectedError = FsErrorStub({ code: 'ENOTDIR', path: '/repo/step7.png/nested' });
      proxy.notADirectory({ path: '/repo/step7.png/nested' });

      expect(() => readFileBytesSync('/repo/step7.png/nested')).toThrow(expectedError);
    });

    it('ERROR: {path: custom error via throws} => throws the staged error', () => {
      const proxy = readFileBytesSyncProxy();
      const expectedError = FsErrorStub({ code: 'EIO', path: '/repo/io-fail.bin' });
      proxy.throws({ path: '/repo/io-fail.bin', error: expectedError });

      expect(() => readFileBytesSync('/repo/io-fail.bin')).toThrow(expectedError);
    });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPath, a predicate} => returns bytes for a path the predicate accepts', () => {
      const proxy = readFileBytesSyncProxy();
      const bytes = Buffer.from([137, 80, 78, 71]);
      proxy.returnsMatchingPath({
        path: (value) => String(value).endsWith('step7.png'),
        bytes,
      });

      const result = readFileBytesSync('/resolved/at/runtime/step7.png');

      expect(result).toStrictEqual(bytes);
    });

    it('ERROR: {throwsMatchingPath, a predicate} => throws the staged error', () => {
      const proxy = readFileBytesSyncProxy();
      const error = FsErrorStub({ code: 'ENOENT', path: '/resolved/at/runtime/missing.png' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('missing.png'),
        error,
      });

      expect(() => readFileBytesSync('/resolved/at/runtime/missing.png')).toThrow(error);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', () => {
      const proxy = readFileBytesSyncProxy();
      const bytes = Buffer.from([137, 80, 78, 71]);
      proxy.returns({ path: '/repo/.dungeonmaster-assets/step7.png', bytes });

      readFileBytesSync('/repo/.dungeonmaster-assets/step7.png');

      expect(proxy.getCallsFor({ path: '/repo/.dungeonmaster-assets/step7.png' })).toStrictEqual([
        ['/repo/.dungeonmaster-assets/step7.png'],
      ]);
    });
  });
});
