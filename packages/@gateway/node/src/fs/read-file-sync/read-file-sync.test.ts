import { readFileSync } from './read-file-sync';
import { readFileSyncProxy } from './read-file-sync.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

describe('readFileSync', () => {
  it('VALID: {path: a file with contents} => returns the contents as a string', () => {
    const proxy = readFileSyncProxy();
    proxy.returns({ path: '/tmp/config.json', contents: '{"a":1}' });

    expect(readFileSync('/tmp/config.json')).toBe('{"a":1}');
  });

  it('EDGE: {path: an empty file} => returns an empty string', () => {
    const proxy = readFileSyncProxy();
    proxy.returns({ path: '/tmp/empty.txt', contents: '' });

    expect(readFileSync('/tmp/empty.txt')).toBe('');
  });

  it('ERROR: {path: a missing file, ENOENT} => throws the raw error', () => {
    const proxy = readFileSyncProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/tmp/missing.json' });
    proxy.throws({ path: '/tmp/missing.json', error });

    expect(() => readFileSync('/tmp/missing.json')).toThrow(error);
  });

  it('ERROR: {path: an unreadable file, EACCES} => throws the raw error', () => {
    const proxy = readFileSyncProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/tmp/locked.json' });
    proxy.throws({ path: '/tmp/locked.json', error });

    expect(() => readFileSync('/tmp/locked.json')).toThrow(error);
  });

  it('ERROR: {path: a directory, EISDIR} => throws the raw error', () => {
    const proxy = readFileSyncProxy();
    const error = FsErrorStub({ code: 'EISDIR', path: '/tmp/a-dir' });
    proxy.throws({ path: '/tmp/a-dir', error });

    expect(() => readFileSync('/tmp/a-dir')).toThrow(error);
  });

  it('ERROR: {path: a path through a non-directory segment, ENOTDIR} => throws the raw error', () => {
    const proxy = readFileSyncProxy();
    const error = FsErrorStub({ code: 'ENOTDIR', path: '/tmp/a-file/child' });
    proxy.throws({ path: '/tmp/a-file/child', error });

    expect(() => readFileSync('/tmp/a-file/child')).toThrow(error);
  });
});
