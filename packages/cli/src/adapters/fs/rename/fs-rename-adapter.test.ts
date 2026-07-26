import { fsRenameAdapter } from './fs-rename-adapter';
import { fsRenameAdapterProxy } from './fs-rename-adapter.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('fsRenameAdapter', () => {
  it('VALID: {from, to} => renames file successfully', async () => {
    const proxy = fsRenameAdapterProxy();
    const from = FilePathStub({ value: '/x.tmp' });
    proxy.succeeds({ from });

    const result = await fsRenameAdapter({
      from,
      to: FilePathStub({ value: '/x.json' }),
    });

    expect(result).toStrictEqual({ success: true });
    expect(proxy.getRenameCalls()).toStrictEqual([{ from: '/x.tmp', to: '/x.json' }]);
  });

  it('ERROR: {from: missing} => rejects with error', async () => {
    const proxy = fsRenameAdapterProxy();
    const from = FilePathStub({ value: '/missing' });
    proxy.throws({ from, error: new Error('ENOENT: no such file') });

    await expect(
      fsRenameAdapter({
        from,
        to: FilePathStub({ value: '/x.json' }),
      }),
    ).rejects.toThrow(/ENOENT/u);
  });
});
