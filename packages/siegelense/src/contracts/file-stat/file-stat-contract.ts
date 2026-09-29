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

import { z } from 'zod';

import { epochMsContract } from '../epoch-ms/epoch-ms-contract';
import { fileSizeBytesContract } from '../file-size-bytes/file-size-bytes-contract';

export const fileStatContract = z.object({
  sizeBytes: fileSizeBytesContract,
  modifiedAtMs: epochMsContract,
});

export type FileStat = z.infer<typeof fileStatContract>;
