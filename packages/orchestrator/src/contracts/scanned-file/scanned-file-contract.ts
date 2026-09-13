/**
 * PURPOSE: One file the transcript walk found, with the two numbers that decide whether it needs
 *   re-reading. Reach for this over a bare path list: the usage scan runs on a tree of ~2,200
 *   files and 1.8 GB, and re-reading all of it every minute is the difference between a background
 *   measurement and a disk hog — `mtimeMs` and `size` together are what let a scan skip the ~97%
 *   of files nothing has touched.
 *
 * USAGE:
 * scannedFileContract.parse({ path: '/home/u/.claude/projects/p/s.jsonl', mtimeMs: 1, size: 40 });
 * // Returns: ScannedFile
 */

import { z } from 'zod';

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

export const scannedFileContract = z.object({
  path: absoluteFilePathContract,
  mtimeMs: z.number().min(0).brand<'EpochMs'>(),
  size: z.number().int().min(0).brand<'ByteSize'>(),
});

export type ScannedFile = z.infer<typeof scannedFileContract>;
