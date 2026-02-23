/**
 * PURPOSE: Joins path segments into a single file path using Node.js path module
 *
 * USAGE:
 * const fullPath = pathJoinAdapter({ segments: ['/home/user', '.claude', 'subagents'] });
 * // Returns FilePath '/home/user/.claude/subagents'
 */

import { join } from 'path';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const pathJoinAdapter = ({ segments }: { segments: string[] }): FilePath =>
  filePathContract.parse(join(...segments));
