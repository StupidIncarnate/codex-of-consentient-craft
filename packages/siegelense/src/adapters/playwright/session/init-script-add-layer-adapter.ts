/**
 * PURPOSE: Installs an init script on the Playwright page for the `before` step verb.
 * Reach for this over inline page.addInitScript calls to keep the Playwright init script
 * mutation isolated in a testable layer adapter within the session adapter folder.
 *
 * USAGE:
 * await initScriptAddLayerAdapter({ page, source: 'window.__injected = true;' });
 * // Installs init script, then returns { success: true }
 */

import type { Page } from '@playwright/test';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const initScriptAddLayerAdapter = async ({
  page,
  source,
}: {
  page: Page;
  source: string;
}): Promise<AdapterResult> => {
  await page.addInitScript({ content: source });

  return { success: true as const };
};
