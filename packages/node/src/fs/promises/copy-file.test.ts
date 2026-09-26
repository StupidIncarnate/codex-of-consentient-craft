import { copyFile } from './copy-file';
import { copyFileProxy } from './copy-file.proxy';
import { FsErrorStub } from '../fs-error.stub';

describe('copyFile', () => {
  it('VALID: {from, to} => copies the file and resolves', async () => {
    const proxy = copyFileProxy();
    proxy.succeeds({ from: '/repo/tmp/frame.png', to: '/repo/tmp/shot.png' });

    await expect(copyFile('/repo/tmp/frame.png', '/repo/tmp/shot.png')).resolves.toBe(undefined);
  });

  it('ERROR: {source does not exist} => rejects with the raw ENOENT error', async () => {
    const proxy = copyFileProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/repo/tmp/missing.png' });
    proxy.rejects({ from: '/repo/tmp/missing.png', to: '/repo/tmp/shot.png', error });

    await expect(copyFile('/repo/tmp/missing.png', '/repo/tmp/shot.png')).rejects.toBe(error);
  });

  it('ERROR: {destination has no write permission} => rejects with the raw EACCES error', async () => {
    const proxy = copyFileProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/readonly/shot.png' });
    proxy.rejects({ from: '/repo/tmp/frame.png', to: '/readonly/shot.png', error });

    await expect(copyFile('/repo/tmp/frame.png', '/readonly/shot.png')).rejects.toBe(error);
  });
});
