/**
 * PURPOSE: Adapter for path.join to join file path segments
 *
 * USAGE:
 * const joinedPath = pathJoinAdapter({ paths: ['/base', 'folder', 'file.ts'] });
 * // Returns validated FilePath
 */
import { join } from 'path';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const pathJoinAdapter = ({ paths }: { paths: readonly string[] }): FilePath =>
  filePathContract.parse(join(...paths));
