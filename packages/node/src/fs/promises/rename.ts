/**
 * PURPOSE: Renames a path, atomic when both sides sit on the same filesystem. EXDEV rejects raw
 * rather than falling back to copy+delete — writeFileAtomic is where that fallback lives, for a
 * caller that wants cross-device semantics.
 *
 * USAGE:
 * await rename('/repo/tmp/registry.json.tmp', '/repo/tmp/registry.json');
 * // Renames from onto to; rejects raw on ENOENT, EACCES, ENOTEMPTY, EEXIST or EXDEV
 */

import { rename as fsRename } from 'fs/promises';

export const rename = async (from: string, to: string): Promise<void> => fsRename(from, to);
