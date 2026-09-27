import { writeFileAtomic } from './write-file-atomic';
import { writeFileAtomicProxy } from './write-file-atomic.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('writeFileAtomic', () => {
  it('VALID: {path, contents} => writes the tmp file then renames it onto path', async () => {
    const proxy = writeFileAtomicProxy();
    proxy.succeeds({ path: '/repo/registry.json' });

    await expect(writeFileAtomic('/repo/registry.json', '{"instances":[]}')).resolves.toBe(
      undefined,
    );
  });

  it('ERROR: {mkdir rejects with EACCES} => rejects without writing a tmp file', async () => {
    const proxy = writeFileAtomicProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/readonly' });
    proxy.mkdirRejects({ path: '/readonly/registry.json', error });

    await expect(writeFileAtomic('/readonly/registry.json', '{}')).rejects.toBe(error);
  });

  it('ERROR: {tmp write rejects with ENOSPC} => rejects with the raw error', async () => {
    const proxy = writeFileAtomicProxy();
    const error = FsErrorStub({ code: 'ENOSPC', path: '/repo/registry.json.tmp' });
    proxy.writeRejects({ path: '/repo/registry.json', error });

    await expect(writeFileAtomic('/repo/registry.json', '{}')).rejects.toBe(error);
  });

  it('ERROR: {rename rejects with EXDEV} => rejects with the rename error and removes the tmp file', async () => {
    const proxy = writeFileAtomicProxy();
    const error = FsErrorStub({ code: 'EXDEV', path: '/repo/registry.json.tmp' });
    proxy.renameRejects({ path: '/repo/registry.json', error });

    await expect(writeFileAtomic('/repo/registry.json', '{"instances":[]}')).rejects.toBe(error);
    expect(proxy.unlinkCallsForTmp({ path: '/repo/registry.json' })).toStrictEqual([
      ['/repo/registry.json.tmp'],
    ]);
  });

  it('ERROR: {rename rejects, tmp cleanup unlink rejects with ENOENT} => rejects with the original rename error', async () => {
    const proxy = writeFileAtomicProxy();
    const renameError = FsErrorStub({ code: 'EXDEV', path: '/repo/registry.json.tmp' });
    const unlinkError = FsErrorStub({ code: 'ENOENT', path: '/repo/registry.json.tmp' });
    proxy.renameRejectsThenUnlinkRejects({ path: '/repo/registry.json', renameError, unlinkError });

    await expect(writeFileAtomic('/repo/registry.json', '{"instances":[]}')).rejects.toBe(
      renameError,
    );
  });

  it('ERROR: {rename rejects, tmp cleanup unlink rejects with EACCES} => rejects with the cleanup error', async () => {
    const proxy = writeFileAtomicProxy();
    const renameError = FsErrorStub({ code: 'EXDEV', path: '/repo/registry.json.tmp' });
    const unlinkError = FsErrorStub({ code: 'EACCES', path: '/repo/registry.json.tmp' });
    proxy.renameRejectsThenUnlinkRejects({ path: '/repo/registry.json', renameError, unlinkError });

    await expect(writeFileAtomic('/repo/registry.json', '{"instances":[]}')).rejects.toBe(
      unlinkError,
    );
  });
});
