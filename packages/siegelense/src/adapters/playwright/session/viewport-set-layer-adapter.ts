/**
 * PURPOSE: Resizes the Playwright page viewport for the `resize` step verb.
 * Reach for this over inline page.setViewportSize calls to keep the Playwright viewport
 * mutation isolated in a testable layer adapter within the session adapter folder.
 *
 * USAGE:
 * await viewportSetLayerAdapter({ page, width: 1280, height: 720 });
 * // Resizes viewport, then returns { success: true }
 */

import type { Page } from '@playwright/test';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const viewportSetLayerAdapter = async ({
  page,
  width,
  height,
}: {
  page: Page;
  width: number;
  height: number;
}): Promise<AdapterResult> => {
  await page.setViewportSize({ width, height });

  return { success: true as const };
};
