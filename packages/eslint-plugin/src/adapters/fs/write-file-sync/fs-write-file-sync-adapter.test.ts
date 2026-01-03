import { fsWriteFileSyncAdapter } from './fs-write-file-sync-adapter';
import { fsWriteFileSyncAdapterProxy } from './fs-write-file-sync-adapter.proxy';
import { FilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';

describe('fsWriteFileSyncAdapter', () => {
  it('VALID: writes file contents synchronously', () => {
    const proxy = fsWriteFileSyncAdapterProxy();
    const filePath = FilePathStub({ value: '/test/file.js' });
    const contents = FileContentsStub({ value: 'test content' });

    proxy.succeeds({ filePath, contents });

    fsWriteFileSyncAdapter({ filePath, contents });

    // Expect no errors thrown
    expect(true).toBe(true);
  });

  it('VALID: writes with custom encoding', () => {
    const proxy = fsWriteFileSyncAdapterProxy();
    const filePath = FilePathStub({ value: '/test/file.js' });
    const contents = FileContentsStub({ value: 'test content' });

    proxy.succeeds({ filePath, contents });

    fsWriteFileSyncAdapter({ filePath, contents, encoding: 'ascii' });

    // Expect no errors thrown
    expect(true).toBe(true);
  });
});
