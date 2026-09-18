/**
 * PURPOSE: Reads localStorage and sessionStorage from the active Playwright page filtered by key prefix,
 * returning a validated StorageReading containing origin, local, and session dictionaries.
 * Reach for this over inline page evaluation to keep page storage extraction isolated in a testable
 * layer adapter within the session adapter folder.
 *
 * USAGE:
 * const reading = await storageReadLayerAdapter({ page, prefix: 'dm-' });
 * // Returns { origin: 'http://localhost:3000', local: { 'dm-a': '1' }, session: {} }
 */

import type { Page } from '@playwright/test';

import { storageReadingContract } from '../../../contracts/storage-reading/storage-reading-contract';
import type { StorageReading } from '../../../contracts/storage-reading/storage-reading-contract';

export const storageReadLayerAdapter = async ({
  page,
  prefix,
}: {
  page: Page;
  prefix: string;
}): Promise<StorageReading> => {
  const raw: unknown = await page.evaluate(
    (p) => ({
      origin: window.location.origin,
      local: Object.fromEntries(
        Object.keys(window.localStorage)
          .filter((k) => k.startsWith(p))
          .map((k) => [k, window.localStorage.getItem(k)]),
      ),
      session: Object.fromEntries(
        Object.keys(window.sessionStorage)
          .filter((k) => k.startsWith(p))
          .map((k) => [k, window.sessionStorage.getItem(k)]),
      ),
    }),
    prefix,
  );

  return storageReadingContract.parse(raw);
};
