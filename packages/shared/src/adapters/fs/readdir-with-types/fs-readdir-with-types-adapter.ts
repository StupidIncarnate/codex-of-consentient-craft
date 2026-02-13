/**
 * PURPOSE: Reads directory entries with file type information using readdirSync
 *
 * USAGE:
 * const entries = fsReaddirWithTypesAdapter({ dirPath: AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster' }) });
 * // Returns Dirent[] with name and type information
 */

import { readdirSync, type Dirent } from 'fs';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const fsReaddirWithTypesAdapter = ({ dirPath }: { dirPath: AbsoluteFilePath }): Dirent[] =>
  readdirSync(dirPath, { withFileTypes: true });
