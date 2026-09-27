import { readJsonFileSyncIfExists } from './read-json-file-sync-if-exists';
import { readJsonFileSyncIfExistsProxy } from './read-json-file-sync-if-exists.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

describe('readJsonFileSyncIfExists', () => {
  it('VALID: {path: a file with a JSON object} => returns the parsed value', () => {
    const proxy = readJsonFileSyncIfExistsProxy();
    proxy.returns({ path: '/tmp/config.json', json: '{"a":1}' });

    expect(readJsonFileSyncIfExists('/tmp/config.json')).toStrictEqual({ a: 1 });
  });

  it('EMPTY: {path: a missing file, ENOENT} => returns null', () => {
    const proxy = readJsonFileSyncIfExistsProxy();
    proxy.missing({ path: '/tmp/missing.json' });

    expect(readJsonFileSyncIfExists('/tmp/missing.json')).toBe(null);
  });

  it('INVALID: {path: a file with malformed JSON} => throws a SyntaxError naming the path', () => {
    const proxy = readJsonFileSyncIfExistsProxy();
    proxy.returns({ path: '/tmp/broken.json', json: '{not json' });

    expect(() => readJsonFileSyncIfExists('/tmp/broken.json')).toThrow(
      /^Invalid JSON in \/tmp\/broken\.json: /u,
    );
  });

  it('EMPTY: {path: an empty file, present but empty} => throws a SyntaxError, not null', () => {
    const proxy = readJsonFileSyncIfExistsProxy();
    proxy.returns({ path: '/tmp/empty.json', json: '' });

    expect(() => readJsonFileSyncIfExists('/tmp/empty.json')).toThrow(
      /^Invalid JSON in \/tmp\/empty\.json: /u,
    );
  });

  it('ERROR: {path: an unreadable file, EACCES} => throws the raw error', () => {
    const proxy = readJsonFileSyncIfExistsProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/tmp/locked.json' });
    proxy.throws({ path: '/tmp/locked.json', error });

    expect(() => readJsonFileSyncIfExists('/tmp/locked.json')).toThrow(error);
  });
});
