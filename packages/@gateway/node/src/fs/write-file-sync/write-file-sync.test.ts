import { writeFileSync } from './write-file-sync';
import { writeFileSyncProxy } from './write-file-sync.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

describe('writeFileSync', () => {
  it('VALID: {path, contents} => writes the given contents', () => {
    const proxy = writeFileSyncProxy();
    proxy.succeeds({ path: '/tmp/config.json' });

    writeFileSync('/tmp/config.json', '{"a":1}');

    expect(proxy.writtenContents({ path: '/tmp/config.json' })).toBe('{"a":1}');
  });

  it('EMPTY: {path, contents: ""} => writes an empty file', () => {
    const proxy = writeFileSyncProxy();
    proxy.succeeds({ path: '/tmp/empty.txt' });

    writeFileSync('/tmp/empty.txt', '');

    expect(proxy.writtenContents({ path: '/tmp/empty.txt' })).toBe('');
  });

  it('ERROR: {path: a missing parent directory, ENOENT} => throws the raw error', () => {
    const proxy = writeFileSyncProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/tmp/nodir/config.json' });
    proxy.throws({ path: '/tmp/nodir/config.json', error });

    expect(() => {
      writeFileSync('/tmp/nodir/config.json', '{}');
    }).toThrow(error);
  });

  it('ERROR: {path: an unwritable path, EACCES} => throws the raw error', () => {
    const proxy = writeFileSyncProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/tmp/locked.json' });
    proxy.throws({ path: '/tmp/locked.json', error });

    expect(() => {
      writeFileSync('/tmp/locked.json', '{}');
    }).toThrow(error);
  });

  it('ERROR: {path: a directory, EISDIR} => throws the raw error', () => {
    const proxy = writeFileSyncProxy();
    const error = FsErrorStub({ code: 'EISDIR', path: '/tmp/adir' });
    proxy.throws({ path: '/tmp/adir', error });

    expect(() => {
      writeFileSync('/tmp/adir', '{}');
    }).toThrow(error);
  });

  it('VALID: {two writes to the same path} => calls reads back each call in order', () => {
    const proxy = writeFileSyncProxy();
    proxy.succeeds({ path: '/tmp/config.json' });

    writeFileSync('/tmp/config.json', '{"a":1}');
    writeFileSync('/tmp/config.json', '{"a":2}');

    expect(proxy.calls({ path: '/tmp/config.json' })).toStrictEqual([
      ['/tmp/config.json', '{"a":1}', 'utf8'],
      ['/tmp/config.json', '{"a":2}', 'utf8'],
    ]);
  });

  it('VALID: {succeedsUnder a root} => a file beneath it is written, a sibling path hits the trap', () => {
    const proxy = writeFileSyncProxy();
    proxy.succeedsUnder({ root: '/tmp/project' });

    writeFileSync('/tmp/project/a/b.json', '{}');

    expect(proxy.writtenContents({ path: '/tmp/project/a/b.json' })).toBe('{}');
    expect(() => {
      writeFileSync('/tmp/project-other/b.json', '{}');
    }).toThrow(
      /^registerMock: nothing set up for the call mockConstructor\("\/tmp\/project-other\/b.json"/u,
    );
  });
});
