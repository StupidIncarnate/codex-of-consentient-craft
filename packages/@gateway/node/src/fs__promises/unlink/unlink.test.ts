import { unlink } from './unlink';
import { unlinkProxy } from './unlink.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('unlink', () => {
  it('VALID: {path} => removes the file and resolves', async () => {
    const proxy = unlinkProxy();
    proxy.succeeds({ path: '/repo/tmp/stale.lock' });

    await expect(unlink('/repo/tmp/stale.lock')).resolves.toBe(undefined);
  });

  it('ERROR: {path does not exist} => rejects with the raw ENOENT error', async () => {
    const proxy = unlinkProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/repo/tmp/missing.lock' });
    proxy.rejects({ path: '/repo/tmp/missing.lock', error });

    await expect(unlink('/repo/tmp/missing.lock')).rejects.toBe(error);
  });

  it('ERROR: {path is a directory} => rejects with the raw EISDIR error', async () => {
    const proxy = unlinkProxy();
    const error = FsErrorStub({ code: 'EISDIR', path: '/repo/tmp' });
    proxy.rejects({ path: '/repo/tmp', error });

    await expect(unlink('/repo/tmp')).rejects.toBe(error);
  });

  describe('call inspection', () => {
    it('VALID: {two files unlinked} => getCallsFor reads back two calls in order', async () => {
      const proxy = unlinkProxy();
      proxy.succeeds({ path: '/repo/tmp/first.lock' });
      proxy.succeeds({ path: '/repo/tmp/second.lock' });

      await unlink('/repo/tmp/first.lock');
      await unlink('/repo/tmp/second.lock');

      expect(proxy.getCallsFor({ path: () => true })).toStrictEqual([
        ['/repo/tmp/first.lock'],
        ['/repo/tmp/second.lock'],
      ]);
    });

    it('VALID: {predicate matching one path} => getCallsFor returns only matching calls', async () => {
      const proxy = unlinkProxy();
      proxy.succeeds({ path: '/repo/tmp/first.lock' });
      proxy.succeeds({ path: '/repo/tmp/second.lock' });

      await unlink('/repo/tmp/first.lock');
      await unlink('/repo/tmp/second.lock');

      expect(proxy.getCallsFor({ path: (p) => String(p).endsWith('first.lock') })).toStrictEqual([
        ['/repo/tmp/first.lock'],
      ]);
    });
  });
});
