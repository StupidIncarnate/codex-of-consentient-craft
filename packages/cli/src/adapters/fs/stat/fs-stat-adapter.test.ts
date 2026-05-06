import { fsStatAdapter } from './fs-stat-adapter';
import { fsStatAdapterProxy } from './fs-stat-adapter.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('fsStatAdapter', () => {
  it('VALID: {filePath: existing} => returns stats with mtimeMs', async () => {
    const proxy = fsStatAdapterProxy();
    proxy.returnsMtime({ mtimeMs: 1234 });

    const result = await fsStatAdapter({ filePath: FilePathStub({ value: '/x' }) });

    expect(result?.mtimeMs).toBe(1234);
  });

  it('EMPTY: {filePath: missing} => returns null on ENOENT', async () => {
    const proxy = fsStatAdapterProxy();
    proxy.returnsNull();

    const result = await fsStatAdapter({ filePath: FilePathStub({ value: '/missing' }) });

    expect(result).toBe(null);
  });

  it('ERROR: {filePath: permission denied} => rethrows non-ENOENT errors', async () => {
    const proxy = fsStatAdapterProxy();
    proxy.throws({ error: Object.assign(new Error('EACCES'), { code: 'EACCES' }) });

    await expect(fsStatAdapter({ filePath: FilePathStub({ value: '/x' }) })).rejects.toThrow(
      /EACCES/u,
    );
  });

  it('EMPTY: {filePath: missing, thrown value has prototype-stripped Error with code: ENOENT} => returns null via duck-typed object check', async () => {
    const proxy = fsStatAdapterProxy();
    const err = Object.assign(new Error('ENOENT: prototype-stripped'), { code: 'ENOENT' });
    proxy.throws({ error: err });
    Object.setPrototypeOf(err, Object.prototype);

    const result = await fsStatAdapter({ filePath: FilePathStub({ value: '/x' }) });

    expect(result).toBe(null);
  });
});
