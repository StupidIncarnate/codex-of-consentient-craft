/**
 * PURPOSE: A file's size and last modification time, branded — the two fields a caller keeps from
 * `statIfExists`'s answer (which also carries `kind` and `createdAtMs`) so the size compare and the
 * mtime read stay typed. Reach for this over the raw gateway shape when a stat result is stored or
 * compared.
 *
 * USAGE:
 * fileStatContract.parse({ sizeBytes: 2048, modifiedAtMs: 1700000000000 });
 * // Returns a validated FileStat
 */

import { z } from '#gateway/npm/zod';


export const fileStatContract = z.object({
  sizeBytes: z.number().int().nonnegative().brand<'FileStatSizeBytes'>(),
  modifiedAtMs: z.number().int().nonnegative().brand<'FileStatModifiedAtMs'>(),
});

export type FileStat = z.infer<typeof fileStatContract>;
