import { writeFileCreatingParent } from './write-file-creating-parent';
import { writeFileCreatingParentProxy } from './write-file-creating-parent.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('writeFileCreatingParent', () => {
  it('VALID: {parent directory does not exist yet} => creates it then writes the file', async () => {
    const proxy = writeFileCreatingParentProxy();
    proxy.succeeds({ path: '/project/.claude/settings.json' });

    await expect(
      writeFileCreatingParent('/project/.claude/settings.json', '{"hooks":{}}'),
    ).resolves.toBe(undefined);
    expect(proxy.writtenContentsFor({ path: '/project/.claude/settings.json' })).toBe(
      '{"hooks":{}}',
    );
  });

  it('ERROR: {mkdir rejects with EACCES} => rejects without writing', async () => {
    const proxy = writeFileCreatingParentProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/readonly/.claude' });
    proxy.mkdirRejects({ path: '/readonly/.claude/settings.json', error });

    await expect(writeFileCreatingParent('/readonly/.claude/settings.json', '{}')).rejects.toBe(
      error,
    );
  });

  it('ERROR: {write rejects with EISDIR} => rejects with the raw error', async () => {
    const proxy = writeFileCreatingParentProxy();
    const error = FsErrorStub({ code: 'EISDIR', path: '/project/.claude/settings.json' });
    proxy.writeRejects({ path: '/project/.claude/settings.json', error });

    await expect(writeFileCreatingParent('/project/.claude/settings.json', '{}')).rejects.toBe(
      error,
    );
  });

  it('VALID: {two calls to the same path} => getCallsFor and mkdirCallsFor read back each call in order', async () => {
    const proxy = writeFileCreatingParentProxy();
    proxy.succeeds({ path: '/project/.claude/settings.json' });

    await writeFileCreatingParent('/project/.claude/settings.json', '{"a":1}');
    await writeFileCreatingParent('/project/.claude/settings.json', '{"a":2}');

    expect(proxy.getCallsFor({ path: '/project/.claude/settings.json' })).toStrictEqual([
      ['/project/.claude/settings.json', '{"a":1}', 'utf8'],
      ['/project/.claude/settings.json', '{"a":2}', 'utf8'],
    ]);
    expect(proxy.mkdirCallsFor({ path: '/project/.claude/settings.json' })).toStrictEqual([
      ['/project/.claude', { recursive: true }],
      ['/project/.claude', { recursive: true }],
    ]);
  });
});
