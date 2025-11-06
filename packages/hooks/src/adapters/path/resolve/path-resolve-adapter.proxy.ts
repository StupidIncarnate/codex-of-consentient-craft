import type { FilePath } from '../../../../contracts/file-path/file-path-contract';

export const pathResolveAdapterProxy = jest.fn<FilePath, [{ paths: string[] }]>();

jest.mock('./path-resolve-adapter', () => ({
  pathResolveAdapter: pathResolveAdapterProxy,
}));
