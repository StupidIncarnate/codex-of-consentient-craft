/**
 * PURPOSE: A snapshot of the browser's storage state for the active page, extracted from
 * localStorage and sessionStorage filtered by key prefix. Reports the window origin and key-value
 * dictionaries where values can be strings or null.
 *
 * USAGE:
 * storageReadingContract.parse({
 *   origin: 'http://localhost:3000',
 *   local: { 'dm-key': 'value' },
 *   session: {},
 * });
 * // Returns a validated StorageReading
 */

import { z } from '#gateway/npm/zod';

export const storageReadingContract = z
  .object({
    origin: z.string().brand<'StorageReadingOrigin'>(),
    local: z.record(
      z.string(),
      z.string().brand<'StorageReadingLocal'>().nullable(),
    ),
    session: z.record(
      z.string(),
      z.string().brand<'StorageReadingSession'>().nullable(),
    ),
  })
  .strict().brand<'StorageReading'>();

export type StorageReading = z.infer<typeof storageReadingContract>;
