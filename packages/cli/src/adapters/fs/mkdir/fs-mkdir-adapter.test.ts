import { fsMkdirAdapter } from './fs-mkdir-adapter';
import { fsMkdirAdapterProxy } from './fs-mkdir-adapter.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('fsMkdirAdapter', () => {
  it('VALID: {filePath} => creates directory recursively', async () => {
    const proxy = fsMkdirAdapterProxy();
    const filePath = FilePathStub({ value: '/home/x/.dungeonmaster' });
    proxy.succeeds({ filePath });

    const result = await fsMkdirAdapter({ filePath });

    expect(result).toStrictEqual({ success: true });
    expect(proxy.getMkdirCalls()).toStrictEqual([
      { path: '/home/x/.dungeonmaster', options: { recursive: true } },
    ]);
  });

  it('ERROR: {filePath: bad} => rejects', async () => {
    const proxy = fsMkdirAdapterProxy();
    const filePath = FilePathStub({ value: '/x' });
    proxy.throws({ filePath, error: new Error('EACCES') });

    await expect(fsMkdirAdapter({ filePath })).rejects.toThrow(/EACCES/u);
  });
});
