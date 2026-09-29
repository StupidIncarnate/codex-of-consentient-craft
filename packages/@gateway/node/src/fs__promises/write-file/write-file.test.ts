import { writeFile } from './write-file';
import { writeFileProxy } from './write-file.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';
import { FileExistsRecordedErrorStub } from '../../fs/file-exists-recorded-error/file-exists-recorded-error.stub';

describe('writeFile', () => {
  it('VALID: {path, contents} => writes the contents and resolves', async () => {
    const proxy = writeFileProxy();
    proxy.succeeds({ path: '/project/queue.json' });

    await expect(writeFile('/project/queue.json', '{"items":[]}')).resolves.toBe(undefined);
    expect(proxy.writtenContentsFor({ path: '/project/queue.json' })).toBe('{"items":[]}');
  });

  it.each([
    ['ENOENT', '/missing/dir/file.json'],
    ['EACCES', '/readonly/file.json'],
    ['EISDIR', '/project/dir'],
  ])('ERROR: {path} rejects with %s => rejects with the raw error', async (code, path) => {
    const proxy = writeFileProxy();
    const error = FsErrorStub({ code, path });
    proxy.rejects({ path, error });

    await expect(writeFile(path, '{}')).rejects.toBe(error);
  });

  it('ERROR: {disk full} => rejects with ENOSPC', async () => {
    const proxy = writeFileProxy();
    const error = FsErrorStub({ code: 'ENOSPC', path: '/full/file.json' });
    proxy.rejects({ path: '/full/file.json', error });

    await expect(writeFile('/full/file.json', '{}')).rejects.toBe(error);
  });

  it('VALID: {two writes to the same path} => getCallsFor reads back each call in order', async () => {
    const proxy = writeFileProxy();
    proxy.succeeds({ path: '/project/queue.json' });

    await writeFile('/project/queue.json', '{"items":[1]}');
    await writeFile('/project/queue.json', '{"items":[2]}');

    expect(proxy.getCallsFor({ path: '/project/queue.json' })).toStrictEqual([
      ['/project/queue.json', '{"items":[1]}', 'utf8'],
      ['/project/queue.json', '{"items":[2]}', 'utf8'],
    ]);
  });

  it('VALID: {rejectsOnce, then succeeds} => the first write rejects, the retry writes', async () => {
    const proxy = writeFileProxy();
    const error = FileExistsRecordedErrorStub({ path: '/project/registry.lock' });
    proxy.succeeds({ path: '/project/registry.lock' });
    proxy.rejectsOnce({ path: '/project/registry.lock', error });

    const first: unknown = await writeFile('/project/registry.lock', '111').catch(
      (caught: unknown) => caught,
    );

    await expect(writeFile('/project/registry.lock', '222')).resolves.toBe(undefined);
    expect(first).toBe(error);
    expect(proxy.writtenContentsFor({ path: '/project/registry.lock' })).toBe('222');
  });

  it('ERROR: {succeedsOnce, then rejectsOnce} => the first write lands, the second rejects', async () => {
    const proxy = writeFileProxy();
    const error = FileExistsRecordedErrorStub({ path: '/project/registry.lock' });
    proxy.succeedsOnce({ path: '/project/registry.lock' });
    proxy.rejectsOnce({ path: '/project/registry.lock', error });

    await expect(writeFile('/project/registry.lock', '111')).resolves.toBe(undefined);

    const second: unknown = await writeFile('/project/registry.lock', '222').catch(
      (caught: unknown) => caught,
    );

    expect(second).toBe(error);
    expect(proxy.getCallsFor({ path: '/project/registry.lock' })).toStrictEqual([
      ['/project/registry.lock', '111', 'utf8'],
      ['/project/registry.lock', '222', 'utf8'],
    ]);
  });

  it('VALID: {succeedsOnce twice} => two writes land and each is read back in order', async () => {
    const proxy = writeFileProxy();
    proxy.succeedsOnce({ path: '/project/queue.json' });
    proxy.succeedsOnce({ path: '/project/queue.json' });

    await writeFile('/project/queue.json', 'one');
    await writeFile('/project/queue.json', 'two');

    expect(proxy.getCallsFor({ path: '/project/queue.json' })).toStrictEqual([
      ['/project/queue.json', 'one', 'utf8'],
      ['/project/queue.json', 'two', 'utf8'],
    ]);
  });
});
