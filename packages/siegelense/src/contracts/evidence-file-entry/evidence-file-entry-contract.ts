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

import { z } from '#gateway/npm/zod';

export const evidenceFileEntryContract = z
  .object({
    path: z
      .string()
      .min(1)
      .refine(
        (path) => {
          if (path.startsWith('/')) {
            return true;
          }
          if (/^[A-Za-z]:\\/u.test(path)) {
            return true;
          }
          return false;
        },
        { message: 'Path must be absolute (start with / or C:\\ on Windows)' },
      )
      .brand<'EvidenceFileEntryPath'>(),
    bytes: z.number().int().nonnegative().brand<'EvidenceFileEntryBytes'>(),
  })
  .brand<'EvidenceFileEntry'>();

export type EvidenceFileEntry = z.infer<typeof evidenceFileEntryContract>;
