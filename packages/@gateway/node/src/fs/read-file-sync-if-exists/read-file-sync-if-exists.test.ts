import { readFileSyncIfExists } from './read-file-sync-if-exists';
import { readFileSyncIfExistsProxy } from './read-file-sync-if-exists.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

describe('readFileSyncIfExists', () => {
  it('VALID: {path: a file with contents} => returns the contents as a string', () => {
    const proxy = readFileSyncIfExistsProxy();
    proxy.returns({ path: '/tmp/config.json', contents: '{"a":1}' });

    expect(readFileSyncIfExists('/tmp/config.json')).toBe('{"a":1}');
  });

  it('EMPTY: {path: a missing file, ENOENT} => returns null', () => {
    const proxy = readFileSyncIfExistsProxy();
    proxy.missing({ path: '/tmp/missing.json' });

    expect(readFileSyncIfExists('/tmp/missing.json')).toBe(null);
  });

  it('EDGE: {path: an empty file} => returns an empty string, distinct from null', () => {
    const proxy = readFileSyncIfExistsProxy();
    proxy.returns({ path: '/tmp/empty.txt', contents: '' });

    expect(readFileSyncIfExists('/tmp/empty.txt')).toBe('');
  });

  it('ERROR: {path: an unreadable file, EACCES} => throws the raw error', () => {
    const proxy = readFileSyncIfExistsProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/tmp/locked.json' });
    proxy.throws({ path: '/tmp/locked.json', error });

    expect(() => readFileSyncIfExists('/tmp/locked.json')).toThrow(error);
  });

  it('ERROR: {path: a directory, EISDIR} => throws the raw error', () => {
    const proxy = readFileSyncIfExistsProxy();
    const error = FsErrorStub({ code: 'EISDIR', path: '/tmp/a-dir' });
    proxy.throws({ path: '/tmp/a-dir', error });

    expect(() => readFileSyncIfExists('/tmp/a-dir')).toThrow(error);
  });
});
