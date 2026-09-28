/**
 * PURPOSE: Clears a live browser session's storage, tolerating the ONE failure a `reset` step can
 * hit as its very first step against a freshly booted instance: `about:blank` has no origin, so
 * `localStorage`/`sessionStorage` throw a SecurityError rather than clearing anything (DEF-94). Every
 * other rejection propagates unchanged — this layer only swallows the one failure it exists to
 * tolerate, never a genuine one.
 *
 * USAGE:
 * await resetClearStorageLayerBroker({ browser: session });
 * // Returns { cleared: true } once storage clears, or { cleared: false } when the page has no
 * // origin yet — never throws for that one case
 */

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { isStorageInaccessibleErrorGuard } from '../../../guards/is-storage-inaccessible-error/is-storage-inaccessible-error-guard';

export const resetClearStorageLayerBroker = async ({
  browser,
}: {
  browser: BrowserSession;
}): Promise<{ cleared: boolean }> => {
  try {
    await browser.clearStorage();
    return { cleared: true };
  } catch (error: unknown) {
    if (!isStorageInaccessibleErrorGuard({ error })) {
      throw error;
    }
    return { cleared: false };
  }
};
