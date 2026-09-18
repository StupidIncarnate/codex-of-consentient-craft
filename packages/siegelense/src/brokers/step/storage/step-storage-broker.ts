/**
 * PURPOSE: Drives the `storage` step verb — reads browser storage (localStorage and sessionStorage)
 * for the active page, filtered by key prefix, and renders the StorageReading as ContentText JSON.
 *
 * USAGE:
 * await stepStorageBroker({ session, prefix: 'dm-' });
 * // Reads localStorage and sessionStorage matching prefix 'dm-' and renders as ContentText JSON
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { storageReadingRenderTransformer } from '../../../transformers/storage-reading-render/storage-reading-render-transformer';

export const stepStorageBroker = async ({
  session,
  prefix,
}: {
  session: BrowserSession;
  prefix: string;
}): Promise<ContentText> => {
  const reading = await session.readStorage({ prefix });

  return storageReadingRenderTransformer({ reading });
};
