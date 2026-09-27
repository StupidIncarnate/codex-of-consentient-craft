import { writeFileExclusive } from './write-file-exclusive';
import { writeFileExclusiveProxy } from './write-file-exclusive.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('writeFileExclusive', () => {
  it('VALID: {path does not exist yet} => creates the file and resolves', async () => {
    const proxy = writeFileExclusiveProxy();
    proxy.succeeds({ path: '/repo/.dungeonmaster/boot.lock' });

    await expect(writeFileExclusive('/repo/.dungeonmaster/boot.lock', '123')).resolves.toBe(
      undefined,
    );
  });

  it('ERROR: {path already exists} => rejects with the raw EEXIST error', async () => {
    const proxy = writeFileExclusiveProxy();
    const error = FsErrorStub({ code: 'EEXIST', path: '/repo/.dungeonmaster/boot.lock' });
    proxy.rejects({ path: '/repo/.dungeonmaster/boot.lock', error });

    await expect(writeFileExclusive('/repo/.dungeonmaster/boot.lock', '123')).rejects.toBe(error);
  });

  it('ERROR: {missing parent directory} => rejects with the raw ENOENT error', async () => {
    const proxy = writeFileExclusiveProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/missing/boot.lock' });
    proxy.rejects({ path: '/missing/boot.lock', error });

    await expect(writeFileExclusive('/missing/boot.lock', '123')).rejects.toBe(error);
  });
});
