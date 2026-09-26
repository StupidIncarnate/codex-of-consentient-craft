import { rename } from './rename';
import { renameProxy } from './rename.proxy';
import { FsErrorStub } from '../fs-error.stub';

describe('rename', () => {
  it('VALID: {from, to} => renames the path and resolves', async () => {
    const proxy = renameProxy();
    proxy.succeeds({ from: '/repo/tmp/a.json.tmp', to: '/repo/tmp/a.json' });

    await expect(rename('/repo/tmp/a.json.tmp', '/repo/tmp/a.json')).resolves.toBe(undefined);
  });

  it('ERROR: {from does not exist} => rejects with the raw ENOENT error', async () => {
    const proxy = renameProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/repo/tmp/missing.tmp' });
    proxy.rejects({ from: '/repo/tmp/missing.tmp', to: '/repo/tmp/a.json', error });

    await expect(rename('/repo/tmp/missing.tmp', '/repo/tmp/a.json')).rejects.toBe(error);
  });

  it('ERROR: {cross-device rename} => rejects with the raw EXDEV error', async () => {
    const proxy = renameProxy();
    const error = FsErrorStub({ code: 'EXDEV', path: '/repo/tmp/a.json.tmp' });
    proxy.rejects({ from: '/repo/tmp/a.json.tmp', to: '/mnt/other/a.json', error });

    await expect(rename('/repo/tmp/a.json.tmp', '/mnt/other/a.json')).rejects.toBe(error);
  });

  it('ERROR: {destination is a non-empty directory} => rejects with the raw ENOTEMPTY error', async () => {
    const proxy = renameProxy();
    const error = FsErrorStub({ code: 'ENOTEMPTY', path: '/repo/tmp/dir' });
    proxy.rejects({ from: '/repo/tmp/other-dir', to: '/repo/tmp/dir', error });

    await expect(rename('/repo/tmp/other-dir', '/repo/tmp/dir')).rejects.toBe(error);
  });
});
