/**
 * PURPOSE: Reads a file synchronously and returns its contents as a ContentText string
 *
 * USAGE:
 * const contents = fsReadFileSyncAdapter({ filePath: absoluteFilePathContract.parse('/path/to/file.json') });
 * // Returns file contents as ContentText
 *
 * WHEN-TO-USE: When synchronous file reading is needed within sync broker functions
 */

import { readFileSync } from 'fs';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';

export const fsReadFileSyncAdapter = ({ filePath }: { filePath: AbsoluteFilePath }): ContentText =>
  contentTextContract.parse(readFileSync(filePath, 'utf-8'));
