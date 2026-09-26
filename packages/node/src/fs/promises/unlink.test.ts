import { unlink } from './unlink';
import { unlinkProxy } from './unlink.proxy';
import { FsErrorStub } from '../fs-error.stub';

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
});
