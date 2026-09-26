import { rmSync } from './rm-sync';
import { rmSyncProxy } from './rm-sync.proxy';
import { FsErrorStub } from './fs-error.stub';

describe('rmSync', () => {
  it('VALID: {path: an existing file} => removes it', () => {
    const proxy = rmSyncProxy();
    proxy.succeeds({ path: '/repo/tmp/scratch.txt' });

    rmSync('/repo/tmp/scratch.txt');

    expect(proxy.calls({ path: '/repo/tmp/scratch.txt' })).toStrictEqual([
      ['/repo/tmp/scratch.txt', undefined],
    ]);
  });

  it('ERROR: {path: missing, no force} => throws the raw ENOENT error', () => {
    const proxy = rmSyncProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/repo/tmp/gone' });
    proxy.throws({ path: '/repo/tmp/gone', error });

    expect(() => {
      rmSync('/repo/tmp/gone');
    }).toThrow(error);
  });

  it('ERROR: {path: an unremovable path, EACCES} => throws the raw error', () => {
    const proxy = rmSyncProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/repo/tmp/locked' });
    proxy.throws({ path: '/repo/tmp/locked', error });

    expect(() => {
      rmSync('/repo/tmp/locked');
    }).toThrow(error);
  });
});
