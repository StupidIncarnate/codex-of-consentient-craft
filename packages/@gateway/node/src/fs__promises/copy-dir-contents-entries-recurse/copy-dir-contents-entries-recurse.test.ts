import { copyDirContentsEntriesRecurse } from './copy-dir-contents-entries-recurse';
import { copyDirContentsEntriesRecurseProxy } from './copy-dir-contents-entries-recurse.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('copyDirContentsEntriesRecurse', () => {
  it('VALID: {remaining: two entries} => copies each entry into to, recursively and forced', async () => {
    const proxy = copyDirContentsEntriesRecurseProxy();
    proxy.copies({ from: '/tmp/inst_1', entries: ['a.json', 'b.json'] });

    await expect(
      copyDirContentsEntriesRecurse({
        from: '/tmp/inst_1',
        to: '/tmp/dest',
        remaining: ['a.json', 'b.json'],
        copiedPaths: [],
      }),
    ).resolves.toBe(undefined);
    expect(proxy.cpCallsFor({ source: '/tmp/inst_1/b.json' })).toStrictEqual([
      ['/tmp/inst_1/b.json', '/tmp/dest/b.json', { recursive: true, force: true }],
    ]);
  });

  it('EMPTY: {remaining: []} => copies nothing and resolves', async () => {
    const proxy = copyDirContentsEntriesRecurseProxy();

    await expect(
      copyDirContentsEntriesRecurse({
        from: '/tmp/inst_1',
        to: '/tmp/dest',
        remaining: [],
        copiedPaths: [],
      }),
    ).resolves.toBe(undefined);
    expect(proxy.cpCallsFor({ source: '/tmp/inst_1/a.json' })).toStrictEqual([]);
  });

  it('ERROR: {second entry fails to copy} => removes the first entry already copied, then rejects', async () => {
    const proxy = copyDirContentsEntriesRecurseProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/tmp/inst_1/b.json' });
    proxy.secondEntryFails({
      from: '/tmp/inst_1',
      to: '/tmp/dest',
      entries: ['a.json', 'b.json'],
      error,
    });

    await expect(
      copyDirContentsEntriesRecurse({
        from: '/tmp/inst_1',
        to: '/tmp/dest',
        remaining: ['a.json', 'b.json'],
        copiedPaths: [],
      }),
    ).rejects.toBe(error);
    expect(proxy.rmCallsFor({ path: '/tmp/dest/a.json' })).toStrictEqual([
      ['/tmp/dest/a.json', { recursive: true, force: true }],
    ]);
  });

  it("VALID: {two entries} => getCallsFor reads back each cp tuple in call order and the rm of a failed copy's sibling", async () => {
    const proxy = copyDirContentsEntriesRecurseProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/tmp/inst_1/b.json' });
    proxy.secondEntryFails({
      from: '/tmp/inst_1',
      to: '/tmp/dest',
      entries: ['a.json', 'b.json'],
      error,
    });

    await expect(
      copyDirContentsEntriesRecurse({
        from: '/tmp/inst_1',
        to: '/tmp/dest',
        remaining: ['a.json', 'b.json'],
        copiedPaths: [],
      }),
    ).rejects.toBe(error);

    expect(proxy.getCallsFor({ seam: 'cp', path: '/tmp/inst_1/a.json' })).toStrictEqual([
      ['/tmp/inst_1/a.json', '/tmp/dest/a.json', { recursive: true, force: true }],
    ]);
    expect(proxy.getCallsFor({ seam: 'cp', path: '/tmp/inst_1/b.json' })).toStrictEqual([
      ['/tmp/inst_1/b.json', '/tmp/dest/b.json', { recursive: true, force: true }],
    ]);
    expect(proxy.getCallsFor({ seam: 'rm', path: '/tmp/dest/a.json' })).toStrictEqual([
      ['/tmp/dest/a.json', { recursive: true, force: true }],
    ]);
  });
});
