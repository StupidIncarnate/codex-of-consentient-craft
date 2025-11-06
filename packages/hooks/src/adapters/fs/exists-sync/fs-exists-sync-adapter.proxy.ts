import type { FilePath } from '../../../../contracts/file-path/file-path-contract';

export const fsExistsSyncAdapterProxy = jest.fn<boolean, [{ filePath: FilePath }]>();

jest.mock('./fs-exists-sync-adapter', () => ({
  fsExistsSyncAdapter: fsExistsSyncAdapterProxy,
}));
