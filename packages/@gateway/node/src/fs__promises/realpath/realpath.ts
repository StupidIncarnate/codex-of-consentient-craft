/**
 * PURPOSE: Resolves a path through every symlink in its chain to its real, canonical location.
 * Unlike readlink, this requires the final target to exist and never returns the input path in
 * place of a resolved one — a caller checking where a path really points can be misled by a
 * fallback that hands back the unresolved name.
 *
 * USAGE:
 * await realpath('/repo/.dungeonmaster-assets/siegelense-assets');
 * // Returns the fully resolved path; rejects on ENOENT and every other failure
 */

import { realpath as fsRealpath } from 'fs/promises';

export const realpath = async (path: string): Promise<string> => fsRealpath(path);
