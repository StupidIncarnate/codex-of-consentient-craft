import type { FilePath } from '../../../../contracts/file-path/file-path-contract';
import type { FileContents } from '../../../../contracts/file-contents/file-contents-contract';

export const fsReadFileAdapterProxy = jest.fn<Promise<FileContents>, [{ filePath: FilePath }]>();

jest.mock('./fs-read-file-adapter', () => ({
  fsReadFileAdapter: fsReadFileAdapterProxy,
}));
