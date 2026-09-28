import { openForAppendSync } from './open-for-append-sync';
import { openForAppendSyncProxy } from './open-for-append-sync.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

describe('openForAppendSync', () => {
  it('VALID: {path: an existing file} => returns the open file descriptor', () => {
    const proxy = openForAppendSyncProxy();
    proxy.returns({ path: '/tmp/dm-siege-inst_1/api-server.log', fd: 12 });

    expect(openForAppendSync('/tmp/dm-siege-inst_1/api-server.log')).toBe(12);
  });

  it('VALID: {path: a missing file} => creates it and returns the descriptor', () => {
    const proxy = openForAppendSyncProxy();
    proxy.returns({ path: '/tmp/dm-siege-inst_1/new.log', fd: 7 });

    expect(openForAppendSync('/tmp/dm-siege-inst_1/new.log')).toBe(7);
  });

  it('ERROR: {path: a missing parent directory, ENOENT} => throws the raw error', () => {
    const proxy = openForAppendSyncProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/missing/api-server.log' });
    proxy.throws({ path: '/missing/api-server.log', error });

    expect(() => openForAppendSync('/missing/api-server.log')).toThrow(error);
  });

  it('ERROR: {path: an unwritable directory, EACCES} => throws the raw error', () => {
    const proxy = openForAppendSyncProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/locked/api-server.log' });
    proxy.throws({ path: '/locked/api-server.log', error });

    expect(() => openForAppendSync('/locked/api-server.log')).toThrow(error);
  });

  it('VALID: {two calls to the same path} => calls reads back each open call in order', () => {
    const proxy = openForAppendSyncProxy();
    proxy.returns({ path: '/tmp/dm-siege-inst_1/api-server.log', fd: 12 });

    openForAppendSync('/tmp/dm-siege-inst_1/api-server.log');
    openForAppendSync('/tmp/dm-siege-inst_1/api-server.log');

    expect(proxy.calls({ path: '/tmp/dm-siege-inst_1/api-server.log' })).toStrictEqual([
      ['/tmp/dm-siege-inst_1/api-server.log', 'a'],
      ['/tmp/dm-siege-inst_1/api-server.log', 'a'],
    ]);
  });
});
