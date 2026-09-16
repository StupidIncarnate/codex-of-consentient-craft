/**
 * PURPOSE: The shape `fsStatAdapter` answers with for a file that exists — its size and its last
 * modification time, the two `fs.stat` fields a caller needs without touching the rest of Node's
 * `Stats` object. Reach for this over calling `fs.stat` again at a call site: `fsStatAdapter` answers
 * `null` for a missing file (ENOENT) rather than this shape, so a caller branches on that one `null`
 * instead of parsing a `Stats` object itself.
 *
 * USAGE:
 * fileStatContract.parse({ sizeBytes: 2048, modifiedAtMs: 1700000000000 });
 * // Returns a validated FileStat
 */

import { z } from 'zod';

import { epochMsContract } from '../epoch-ms/epoch-ms-contract';
import { fileSizeBytesContract } from '../file-size-bytes/file-size-bytes-contract';

export const fileStatContract = z.object({
  sizeBytes: fileSizeBytesContract,
  modifiedAtMs: epochMsContract,
});

export type FileStat = z.infer<typeof fileStatContract>;
