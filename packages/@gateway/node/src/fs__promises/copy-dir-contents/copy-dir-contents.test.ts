import { copyDirContents } from './copy-dir-contents';
import { copyDirContentsProxy } from './copy-dir-contents.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('copyDirContents', () => {
  it('VALID: {from holds two entries, none excluded} => copies every entry and resolves', async () => {
    const proxy = copyDirContentsProxy();
    proxy.succeeds({ from: '/tmp/inst_1', entries: ['a.json', 'b.json'] });

    await expect(
      copyDirContents({ from: '/tmp/inst_1', to: '/tmp/inst_1/.snapshots/1', excludeNames: [] }),
    ).resolves.toBe(undefined);
  });

  it('EMPTY: {excludeNames matches every entry} => copies nothing and resolves', async () => {
    const proxy = copyDirContentsProxy();
    proxy.succeeds({ from: '/tmp/inst_1', entries: ['.snapshots'] });

    await expect(
      copyDirContents({
        from: '/tmp/inst_1',
        to: '/tmp/inst_1/.snapshots/1',
        excludeNames: ['.snapshots'],
      }),
    ).resolves.toBe(undefined);
  });

  it('ERROR: {readdir rejects with ENOENT} => rejects with the raw error', async () => {
    const proxy = copyDirContentsProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/tmp/missing' });
    proxy.readdirRejects({ from: '/tmp/missing', error });

    await expect(
      copyDirContents({ from: '/tmp/missing', to: '/tmp/dest', excludeNames: [] }),
    ).rejects.toBe(error);
  });

  it('ERROR: {second entry fails to copy} => removes the first entry already copied into to, then rejects', async () => {
    const proxy = copyDirContentsProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/tmp/inst_1/b.json' });
    proxy.secondEntryFails({
      from: '/tmp/inst_1',
      to: '/tmp/inst_1/.snapshots/1',
      entries: ['a.json', 'b.json'],
      error,
    });

    await expect(
      copyDirContents({
        from: '/tmp/inst_1',
        to: '/tmp/inst_1/.snapshots/1',
        excludeNames: [],
      }),
    ).rejects.toBe(error);
    expect(proxy.rmCallsFor({ path: '/tmp/inst_1/.snapshots/1/a.json' })).toStrictEqual([
      ['/tmp/inst_1/.snapshots/1/a.json', { recursive: true, force: true }],
    ]);
  });

  it('VALID: {two copyDirContents calls} => cpCallsFor reads back each cp call in order', async () => {
    const proxy = copyDirContentsProxy();
    proxy.succeeds({ from: '/tmp/inst_1', entries: ['x.json'] });

    await copyDirContents({ from: '/tmp/inst_1', to: '/tmp/dest-a', excludeNames: [] });
    await copyDirContents({ from: '/tmp/inst_1', to: '/tmp/dest-b', excludeNames: [] });

    expect(proxy.cpCallsFor({ source: '/tmp/inst_1/x.json' })).toStrictEqual([
      ['/tmp/inst_1/x.json', '/tmp/dest-a/x.json', { recursive: true, force: true }],
      ['/tmp/inst_1/x.json', '/tmp/dest-b/x.json', { recursive: true, force: true }],
    ]);
  });

  it('VALID: {two calls, one excluded entry} => getCallsFor reads back the readdir and cp tuples in call order', async () => {
    const proxy = copyDirContentsProxy();
    proxy.succeeds({ from: '/tmp/inst_1', entries: ['x.json', '.snapshots'] });

    await copyDirContents({ from: '/tmp/inst_1', to: '/tmp/dest-a', excludeNames: ['.snapshots'] });
    await copyDirContents({ from: '/tmp/inst_1', to: '/tmp/dest-b', excludeNames: ['.snapshots'] });

    expect(proxy.getCallsFor({ seam: 'readdir', path: '/tmp/inst_1' })).toStrictEqual([
      ['/tmp/inst_1'],
      ['/tmp/inst_1'],
    ]);
    expect(proxy.getCallsFor({ seam: 'cp', path: '/tmp/inst_1/x.json' })).toStrictEqual([
      ['/tmp/inst_1/x.json', '/tmp/dest-a/x.json', { recursive: true, force: true }],
      ['/tmp/inst_1/x.json', '/tmp/dest-b/x.json', { recursive: true, force: true }],
    ]);
    expect(proxy.getCallsFor({ seam: 'cp', path: '/tmp/inst_1/.snapshots' })).toStrictEqual([]);
    expect(proxy.getCallsFor({ seam: 'rm', path: '/tmp/dest-a/x.json' })).toStrictEqual([]);
  });
});
