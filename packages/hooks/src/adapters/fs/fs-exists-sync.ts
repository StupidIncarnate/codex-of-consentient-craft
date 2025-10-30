/**
 * PURPOSE: Adapter for fs.existsSync to check if a file path exists
 *
 * USAGE:
 * const exists = fsExistsSync({ filePath: '/path/to/file.ts' });
 * // Returns boolean indicating if the file exists
 */
import { existsSync } from 'fs';
import type { FilePath } from '../../contracts/file-path/file-path-contract';

export const fsExistsSync = ({ filePath }: { filePath: FilePath }): boolean => existsSync(filePath);
