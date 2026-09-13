/**
 * PURPOSE: One transcript the scan still has to read, and the byte it should start at. Reach for
 *   this rather than passing a bare path: the offset is the whole point of the incremental scan —
 *   a path alone would make the batch layer re-read files from zero and count every message twice.
 *
 * USAGE:
 * transcriptReadContract.parse({ path: '/home/u/.claude/projects/p/s.jsonl', fromByte: 4096 });
 * // Returns: TranscriptRead
 */

import { z } from 'zod';

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

export const transcriptReadContract = z.object({
  path: absoluteFilePathContract,
  fromByte: z.number().int().min(0).brand<'ByteSize'>(),
});

export type TranscriptRead = z.infer<typeof transcriptReadContract>;
