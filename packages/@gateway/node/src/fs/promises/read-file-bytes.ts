/**
 * PURPOSE: Reads a whole file as raw bytes, with no encoding applied. Reach for this over
 * readFile whenever the bytes must round-trip losslessly, such as a PNG — decoding as UTF-8 and
 * re-encoding corrupts binary content that isn't valid UTF-8.
 *
 * USAGE:
 * await readFileBytes('/repo/.dungeonmaster-assets/siegelense-assets/step7.png');
 * // Returns the file's raw bytes as a Uint8Array
 */

import { readFile } from 'fs/promises';

export const readFileBytes = async (path: string): Promise<Uint8Array> => readFile(path);
