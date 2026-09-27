import { readJsonFileSync } from './read-json-file-sync';
import { readJsonFileSyncProxy } from './read-json-file-sync.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

describe('readJsonFileSync', () => {
  it('VALID: {path: a file with a JSON object} => returns the parsed value', () => {
    const proxy = readJsonFileSyncProxy();
    proxy.returns({ path: '/tmp/config.json', json: '{"a":1}' });

    expect(readJsonFileSync('/tmp/config.json')).toStrictEqual({ a: 1 });
  });

  it('INVALID: {path: a file with malformed JSON} => throws a SyntaxError naming the path', () => {
    const proxy = readJsonFileSyncProxy();
    proxy.returns({ path: '/tmp/broken.json', json: '{not json' });

    expect(() => readJsonFileSync('/tmp/broken.json')).toThrow(
      /^Invalid JSON in \/tmp\/broken\.json: /u,
    );
  });

  it('EMPTY: {path: an empty file} => throws a SyntaxError, because empty is not JSON', () => {
    const proxy = readJsonFileSyncProxy();
    proxy.returns({ path: '/tmp/empty.json', json: '' });

    expect(() => readJsonFileSync('/tmp/empty.json')).toThrow(
      /^Invalid JSON in \/tmp\/empty\.json: /u,
    );
  });

  it('ERROR: {path: a missing file, ENOENT} => throws the raw error', () => {
    const proxy = readJsonFileSyncProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/tmp/missing.json' });
    proxy.throws({ path: '/tmp/missing.json', error });

    expect(() => readJsonFileSync('/tmp/missing.json')).toThrow(error);
  });

  it('ERROR: {path: an unreadable file, EACCES} => throws the raw error', () => {
    const proxy = readJsonFileSyncProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/tmp/locked.json' });
    proxy.throws({ path: '/tmp/locked.json', error });

    expect(() => readJsonFileSync('/tmp/locked.json')).toThrow(error);
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPath, a predicate} => returns the parsed value for a path the predicate accepts', () => {
      const proxy = readJsonFileSyncProxy();
      proxy.returnsMatchingPath({
        path: (value) => String(value).endsWith('config.json'),
        json: '{"a":1}',
      });

      expect(readJsonFileSync('/resolved/at/runtime/config.json')).toStrictEqual({ a: 1 });
    });

    it('ERROR: {throwsMatchingPath, a predicate} => throws the staged error', () => {
      const proxy = readJsonFileSyncProxy();
      const error = FsErrorStub({ code: 'ENOENT', path: '/resolved/at/runtime/missing.json' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('missing.json'),
        error,
      });

      expect(() => readJsonFileSync('/resolved/at/runtime/missing.json')).toThrow(error);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', () => {
      const proxy = readJsonFileSyncProxy();
      proxy.returns({ path: '/tmp/config.json', json: '{"a":1}' });

      readJsonFileSync('/tmp/config.json');

      expect(proxy.getCallsFor({ path: '/tmp/config.json' })).toStrictEqual([
        ['/tmp/config.json', 'utf8'],
      ]);
    });
  });
});
