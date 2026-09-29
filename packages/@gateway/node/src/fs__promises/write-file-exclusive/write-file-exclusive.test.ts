import { writeFileExclusive } from './write-file-exclusive';
import { writeFileExclusiveProxy } from './write-file-exclusive.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';
import { FileExistsRecordedErrorStub } from '../../fs/file-exists-recorded-error/file-exists-recorded-error.stub';

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

  it('VALID: {two calls to the same path} => getCallsFor reads back each write call in order', async () => {
    const proxy = writeFileExclusiveProxy();
    proxy.succeeds({ path: '/repo/.dungeonmaster/boot.lock' });

    await writeFileExclusive('/repo/.dungeonmaster/boot.lock', '111');
    await writeFileExclusive('/repo/.dungeonmaster/boot.lock', '222');

    expect(proxy.getCallsFor({ path: '/repo/.dungeonmaster/boot.lock' })).toStrictEqual([
      ['/repo/.dungeonmaster/boot.lock', '111', { encoding: 'utf8', flag: 'wx' }],
      ['/repo/.dungeonmaster/boot.lock', '222', { encoding: 'utf8', flag: 'wx' }],
    ]);
  });

  it('VALID: {rejectsOnce EEXIST, then succeeds} => the first create rejects, the retry creates', async () => {
    const proxy = writeFileExclusiveProxy();
    const error = FileExistsRecordedErrorStub({ path: '/repo/.dungeonmaster/boot.lock' });
    proxy.succeeds({ path: '/repo/.dungeonmaster/boot.lock' });
    proxy.rejectsOnce({ path: '/repo/.dungeonmaster/boot.lock', error });

    const first: unknown = await writeFileExclusive('/repo/.dungeonmaster/boot.lock', '111').catch(
      (caught: unknown) => caught,
    );

    await expect(writeFileExclusive('/repo/.dungeonmaster/boot.lock', '222')).resolves.toBe(
      undefined,
    );
    expect(first).toBe(error);
    expect(proxy.getCallsFor({ path: '/repo/.dungeonmaster/boot.lock' })).toStrictEqual([
      ['/repo/.dungeonmaster/boot.lock', '111', { encoding: 'utf8', flag: 'wx' }],
      ['/repo/.dungeonmaster/boot.lock', '222', { encoding: 'utf8', flag: 'wx' }],
    ]);
  });
});
