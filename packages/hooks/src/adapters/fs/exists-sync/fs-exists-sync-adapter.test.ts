import { fsExistsSyncAdapter } from './fs-exists-sync-adapter';
import { fsExistsSyncAdapterProxy } from './fs-exists-sync-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('fsExistsSyncAdapter', () => {
  it('VALID: {filePath} => returns true when file exists', () => {
    const proxy = fsExistsSyncAdapterProxy();
    const filePath = FilePathStub({ value: '/test/file.ts' });
    proxy.returns({ exists: true });

    const result = fsExistsSyncAdapter({ filePath });

    expect(result).toBe(true);
  });

  it('VALID: {filePath} => returns false when file does not exist', () => {
    const proxy = fsExistsSyncAdapterProxy();
    const filePath = FilePathStub({ value: '/test/file.ts' });
    proxy.returns({ exists: false });

    const result = fsExistsSyncAdapter({ filePath });

    expect(result).toBe(false);
  });
});
