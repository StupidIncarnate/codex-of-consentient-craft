/**
 * PURPOSE: Copies a single file. Leaves a partial copy behind on failure, matching Node's own
 * copyFile — this wrapper adds no cleanup of its own. Reach for copyDirContents when the unit being
 * written is a whole directory tree instead of one file.
 *
 * USAGE:
 * await copyFile('/repo/tmp/frame.png', '/repo/tmp/shot.png');
 * // Copies from onto to, overwriting to if it already exists
 */

import { copyFile as fsCopyFile } from 'fs/promises';

export const copyFile = async (from: string, to: string): Promise<void> => fsCopyFile(from, to);
