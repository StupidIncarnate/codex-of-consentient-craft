/**
 * PURPOSE: Reads back a symlink's raw stored target — relative or absolute, unresolved. Reach for
 * realpath instead when the caller needs the fully resolved path the link points at.
 *
 * USAGE:
 * await readlink('/worktree/node_modules/@dungeonmaster/orchestrator');
 * // Returns the link's raw target; rejects on ENOENT, EACCES and EINVAL (not a link)
 */

import { readlink as fsReadlink } from 'fs/promises';

export const readlink = async (path: string): Promise<string> => fsReadlink(path);
