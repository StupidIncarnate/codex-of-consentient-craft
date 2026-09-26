import { unlinkSync } from './unlink-sync';
import { unlinkSyncProxy } from './unlink-sync.proxy';
import { FsErrorStub } from './fs-error.stub';

describe('unlinkSync', () => {
  it('VALID: {path: an existing file} => removes it', () => {
    const proxy = unlinkSyncProxy();
    proxy.succeeds({ path: '/repo/tmp/stale.lock' });

    unlinkSync('/repo/tmp/stale.lock');

    expect(proxy.calls({ path: '/repo/tmp/stale.lock' })).toStrictEqual([['/repo/tmp/stale.lock']]);
  });

  it('ERROR: {path: missing, ENOENT} => throws the raw error', () => {
    const proxy = unlinkSyncProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/repo/tmp/gone.lock' });
    proxy.throws({ path: '/repo/tmp/gone.lock', error });

    expect(() => {
      unlinkSync('/repo/tmp/gone.lock');
    }).toThrow(error);
  });

  it('ERROR: {path: a directory, EISDIR} => throws the raw error', () => {
    const proxy = unlinkSyncProxy();
    const error = FsErrorStub({ code: 'EISDIR', path: '/repo/tmp/a-dir' });
    proxy.throws({ path: '/repo/tmp/a-dir', error });

    expect(() => {
      unlinkSync('/repo/tmp/a-dir');
    }).toThrow(error);
  });

  it('ERROR: {path: an unremovable file, EACCES} => throws the raw error', () => {
    const proxy = unlinkSyncProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/repo/tmp/locked.lock' });
    proxy.throws({ path: '/repo/tmp/locked.lock', error });

    expect(() => {
      unlinkSync('/repo/tmp/locked.lock');
    }).toThrow(error);
  });
});
