/**
 * PURPOSE: Resolves a path through every symlink in its chain to its real, canonical location.
 * Unlike a raw check, this requires the final target to exist and never returns the input path
 * in place of a resolved one — a caller checking where a path really points can be misled by a
 * fallback that hands back the unresolved name. A symlink loop throws ELOOP raw.
 *
 * USAGE:
 * const resolved = realpathSync('/repo/.dungeonmaster-assets/siegelense-assets');
 * // Returns the fully resolved path; throws on ENOENT, ELOOP and every other failure
 */
import { realpathSync as nodeRealpathSync } from 'fs';

export const realpathSync = (path: string): string => nodeRealpathSync(path);
