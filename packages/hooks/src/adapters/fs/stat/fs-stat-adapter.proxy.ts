import type { Stats } from 'node:fs';
import type { FilePath } from '../../../../contracts/file-path/file-path-contract';

export const fsStatAdapterProxy = jest.fn<Promise<Stats>, [{ filePath: FilePath }]>();

jest.mock('./fs-stat-adapter', () => ({
  fsStatAdapter: fsStatAdapterProxy,
}));
