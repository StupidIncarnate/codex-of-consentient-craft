import { existsSync } from 'fs';
import type { FilePath } from '@questmaestro/shared/contracts';

/**
 * PURPOSE: Checks if a file or directory exists at the given path
 *
 * USAGE:
 * const exists = fsExistsSyncAdapter({ filePath: filePathContract.parse('/path/to/file.ts') });
 * // Returns true if file exists, false otherwise
 */
export const fsExistsSyncAdapter = ({ filePath }: { filePath: FilePath }): boolean =>
  existsSync(filePath);
