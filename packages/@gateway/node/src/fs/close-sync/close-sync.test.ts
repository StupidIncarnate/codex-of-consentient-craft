import { closeSync } from './close-sync';
import { closeSyncProxy } from './close-sync.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

describe('closeSync', () => {
  it('VALID: {fd: an open descriptor} => closes it', () => {
    const proxy = closeSyncProxy();
    proxy.succeeds({ fd: 12 });

    closeSync(12);

    expect(proxy.calls({ fd: 12 })).toStrictEqual([[12]]);
  });

  it('ERROR: {fd: an already-closed descriptor, EBADF} => throws the raw error', () => {
    const proxy = closeSyncProxy();
    const error = FsErrorStub({ code: 'EBADF' });
    proxy.throws({ fd: 12, error });

    expect(() => {
      closeSync(12);
    }).toThrow(error);
  });

  it('VALID: {two different fds closed} => calls({fd: predicate}) reads back both in order', () => {
    const proxy = closeSyncProxy();
    proxy.succeeds({ fd: 12 });
    proxy.succeeds({ fd: 7 });

    closeSync(12);
    closeSync(7);

    expect(proxy.calls({ fd: (): boolean => true })).toStrictEqual([[12], [7]]);
  });
});
