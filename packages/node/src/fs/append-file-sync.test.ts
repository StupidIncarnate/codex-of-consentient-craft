import { appendFileSync } from './append-file-sync';
import { appendFileSyncProxy } from './append-file-sync.proxy';
import { FsErrorStub } from './fs-error.stub';

describe('appendFileSync', () => {
  it('VALID: {path, contents} => appends the given contents', () => {
    const proxy = appendFileSyncProxy();
    proxy.succeeds({ path: '/repo/tmp/scratch.log' });

    appendFileSync('/repo/tmp/scratch.log', 'a line\n');

    expect(proxy.appendedContents({ path: '/repo/tmp/scratch.log' })).toBe('a line\n');
  });

  it('VALID: {path: a missing file} => creates it and appends', () => {
    const proxy = appendFileSyncProxy();
    proxy.succeeds({ path: '/repo/tmp/new.log' });

    appendFileSync('/repo/tmp/new.log', 'first line\n');

    expect(proxy.appendedContents({ path: '/repo/tmp/new.log' })).toBe('first line\n');
  });

  it('ERROR: {path: a missing parent directory, ENOENT} => throws the raw error', () => {
    const proxy = appendFileSyncProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/repo/tmp/nodir/scratch.log' });
    proxy.throws({ path: '/repo/tmp/nodir/scratch.log', error });

    expect(() => {
      appendFileSync('/repo/tmp/nodir/scratch.log', 'x');
    }).toThrow(error);
  });

  it('ERROR: {path: an unwritable path, EACCES} => throws the raw error', () => {
    const proxy = appendFileSyncProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/repo/tmp/locked.log' });
    proxy.throws({ path: '/repo/tmp/locked.log', error });

    expect(() => {
      appendFileSync('/repo/tmp/locked.log', 'x');
    }).toThrow(error);
  });

  it('ERROR: {path: a directory, EISDIR} => throws the raw error', () => {
    const proxy = appendFileSyncProxy();
    const error = FsErrorStub({ code: 'EISDIR', path: '/repo/tmp/adir' });
    proxy.throws({ path: '/repo/tmp/adir', error });

    expect(() => {
      appendFileSync('/repo/tmp/adir', 'x');
    }).toThrow(error);
  });
});
