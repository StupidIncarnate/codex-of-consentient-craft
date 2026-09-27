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

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPath, a predicate} => returns the parsed value for a path the predicate accepts', () => {
      const proxy = readJsonFileSyncIfExistsProxy();
      proxy.returnsMatchingPath({
        path: (value) => String(value).endsWith('config.json'),
        json: '{"a":1}',
      });

      expect(readJsonFileSyncIfExists('/resolved/at/runtime/config.json')).toStrictEqual({ a: 1 });
    });

    it('ERROR: {throwsMatchingPath, a predicate} => throws the staged error', () => {
      const proxy = readJsonFileSyncIfExistsProxy();
      const error = FsErrorStub({ code: 'EACCES', path: '/resolved/at/runtime/locked.json' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('locked.json'),
        error,
      });

      expect(() => readJsonFileSyncIfExists('/resolved/at/runtime/locked.json')).toThrow(error);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', () => {
      const proxy = readJsonFileSyncIfExistsProxy();
      proxy.returns({ path: '/tmp/config.json', json: '{"a":1}' });

      readJsonFileSyncIfExists('/tmp/config.json');

      expect(proxy.getCallsFor({ path: '/tmp/config.json' })).toStrictEqual([
        ['/tmp/config.json', 'utf8'],
      ]);
    });
  });
});
