import { fsExistsSyncAdapter } from './fs-exists-sync-adapter';
import { fsExistsSyncAdapterProxy } from './fs-exists-sync-adapter.proxy';
import { filePathStub } from '../../../../contracts/file-path/file-path.stub';

describe('fsExistsSyncAdapter', () => {
  it('should return true when file exists', () => {
    fsExistsSyncAdapterProxy.mockReturnValue(true);

    const result = fsExistsSyncAdapter({ filePath: filePathStub });

    expect(result).toBe(true);
    expect(fsExistsSyncAdapterProxy).toHaveBeenCalledWith({ filePath: filePathStub });
  });

  it('should return false when file does not exist', () => {
    fsExistsSyncAdapterProxy.mockReturnValue(false);

    const result = fsExistsSyncAdapter({ filePath: filePathStub });

    expect(result).toBe(false);
  });
});
