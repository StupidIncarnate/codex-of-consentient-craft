/**
 * PURPOSE: Adapter for path.resolve with validation to resolve file paths
 *
 * USAGE:
 * const absolutePath = pathResolveAdapter({ paths: ['/base', 'relative', 'file.ts'] });
 * // Returns validated absolute FilePath
 */
import { resolve } from 'path';
import { filePathContract, type FilePath } from '../../../contracts/file-path/file-path-contract';

export const pathResolveAdapter = ({ paths }: { paths: string[] }): FilePath =>
  filePathContract.parse(resolve(...paths));
