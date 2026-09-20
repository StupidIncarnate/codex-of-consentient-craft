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

import { z } from 'zod';

export const storageReadingContract = z
  .object({
    origin: z.string().brand<'StorageOrigin'>(),
    local: z.record(z.string().brand<'StorageValue'>().nullable()),
    session: z.record(z.string().brand<'StorageValue'>().nullable()),
  })
  .strict();

export type StorageReading = z.infer<typeof storageReadingContract>;
