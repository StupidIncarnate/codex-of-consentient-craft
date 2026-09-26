import { writeFile } from './write-file';
import { writeFileProxy } from './write-file.proxy';
import { FsErrorStub } from '../fs-error.stub';

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
});
