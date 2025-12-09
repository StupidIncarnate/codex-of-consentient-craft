import { fsExistsSyncAdapter } from './fs-exists-sync-adapter';
import { fsExistsSyncAdapterProxy } from './fs-exists-sync-adapter.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('fsExistsSyncAdapter', () => {
  it('VALID: {filePath: "/not-exists.ts"} => returns false', () => {
    const adapterProxy = fsExistsSyncAdapterProxy();
    const filePath = FilePathStub({ value: '/not-exists.ts' });

    adapterProxy.returns({ filePath, exists: false });

    const result = fsExistsSyncAdapter({ filePath });

    expect(result).toBe(false);
  });

  it('VALID: {filePath: "/exists.ts"} => returns true', () => {
    const adapterProxy = fsExistsSyncAdapterProxy();
    const filePath = FilePathStub({ value: '/exists.ts' });

    adapterProxy.returns({ filePath, exists: true });

    const result = fsExistsSyncAdapter({ filePath });

    expect(result).toBe(true);
  });
});
