import { unlinkIfExists } from './unlink-if-exists';
import { unlinkIfExistsProxy } from './unlink-if-exists.proxy';
import { FsErrorStub } from '../fs-error.stub';

describe('unlinkIfExists', () => {
  it('VALID: {path exists} => removes it and resolves', async () => {
    const proxy = unlinkIfExistsProxy();
    proxy.succeeds({ path: '/repo/.dungeonmaster/boot.lock' });

    await expect(unlinkIfExists('/repo/.dungeonmaster/boot.lock')).resolves.toBe(undefined);
  });

  it('EMPTY: {path already gone} => resolves without rejecting', async () => {
    const proxy = unlinkIfExistsProxy();
    proxy.missing({ path: '/repo/.dungeonmaster/boot.lock' });

    await expect(unlinkIfExists('/repo/.dungeonmaster/boot.lock')).resolves.toBe(undefined);
  });

  it('ERROR: {no permission to remove} => rejects with the raw EACCES error', async () => {
    const proxy = unlinkIfExistsProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/readonly/boot.lock' });
    proxy.rejects({ path: '/readonly/boot.lock', error });

    await expect(unlinkIfExists('/readonly/boot.lock')).rejects.toBe(error);
  });

  it('ERROR: {path is a directory} => rejects with the raw EISDIR error', async () => {
    const proxy = unlinkIfExistsProxy();
    const error = FsErrorStub({ code: 'EISDIR', path: '/repo/.dungeonmaster' });
    proxy.rejects({ path: '/repo/.dungeonmaster', error });

    await expect(unlinkIfExists('/repo/.dungeonmaster')).rejects.toBe(error);
  });
});
