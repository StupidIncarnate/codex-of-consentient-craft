/**
 * PURPOSE: One file inside an instance's evidence directory, as `status --instance` lists it — an
 * absolute path a `Read` can open as-is, and its size. Reach for this over `FileStat` when the caller
 * wants to NAME a file for a reader: `FileStat` carries no path, and a bare name relative to some
 * other row is exactly what a reader cannot paste into `Read`.
 *
 * USAGE:
 * evidenceFileEntryContract.parse({
 *   path: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_1/video/a1.webm',
 *   bytes: 860132,
 * });
 * // Returns a validated EvidenceFileEntry
 */

import { z } from 'zod';

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

import { fileSizeBytesContract } from '../file-size-bytes/file-size-bytes-contract';

export const evidenceFileEntryContract = z.object({
  path: absoluteFilePathContract,
  bytes: fileSizeBytesContract,
});

export type EvidenceFileEntry = z.infer<typeof evidenceFileEntryContract>;
