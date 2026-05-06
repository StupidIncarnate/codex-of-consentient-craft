import { fsMkdirAdapter } from './fs-mkdir-adapter';
import { fsMkdirAdapterProxy } from './fs-mkdir-adapter.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('fsMkdirAdapter', () => {
  it('VALID: {filePath} => creates directory recursively', async () => {
    const proxy = fsMkdirAdapterProxy();
    proxy.succeeds();

    const result = await fsMkdirAdapter({
      filePath: FilePathStub({ value: '/home/x/.dungeonmaster' }),
    });

    expect(result).toStrictEqual({ success: true });
    expect(proxy.getMkdirCalls()).toStrictEqual([
      { path: '/home/x/.dungeonmaster', options: { recursive: true } },
    ]);
  });

  it('ERROR: {filePath: bad} => rejects', async () => {
    const proxy = fsMkdirAdapterProxy();
    proxy.throws({ error: new Error('EACCES') });

    await expect(fsMkdirAdapter({ filePath: FilePathStub({ value: '/x' }) })).rejects.toThrow(
      /EACCES/u,
    );
  });
});
