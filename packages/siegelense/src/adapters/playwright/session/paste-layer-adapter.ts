/**
 * PURPOSE: Implements the browser-side mechanics for the `paste` step verb. Focuses the
 * target locator or ref element (using strict locator stamping for refs), writes either
 * text or a file payload to the browser clipboard API, and emits `ControlOrMeta+V` with
 * isTrusted true.
 *
 * USAGE:
 * await pasteLayerAdapter({
 *   page,
 *   target: '[data-testid="input"]',
 *   value: 'text to paste',
 *   timeoutMs: 5000,
 * });
 * // Returns { success: true }
 */

import { existsSync, readFileSync } from 'fs';
import * as path from 'path';
import type { Page } from '@playwright/test';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { pasteStatics } from '../../../statics/paste/paste-statics';
import { refRegistryLayerAdapter } from './ref-registry-layer-adapter';

export const pasteLayerAdapter = async ({
  page,
  target,
  within,
  ref,
  filePath,
  value,
  timeoutMs,
}: {
  page: Page;
  target?: string | null | undefined;
  within?: string | null | undefined;
  ref?: number | null | undefined;
  filePath: string | null;
  value: string | null;
  timeoutMs: number;
}): Promise<AdapterResult> => {
  if ((target === null || target === undefined) && (ref === null || ref === undefined)) {
    throw new Error('either target or ref must be provided');
  }
  if (filePath === null && value === null) {
    throw new Error('either filePath or value must be provided');
  }
  if (filePath !== null && !existsSync(filePath)) {
    throw new Error(`file at "${filePath}" does not exist`);
  }

  if (ref !== null && ref !== undefined) {
    const refRegistry = refRegistryLayerAdapter();
    await page.evaluate(refRegistry.stampSource({ ref }));
    try {
      await page.locator(refRegistry.targetSelector()).focus({ timeout: timeoutMs });
    } finally {
      await page.evaluate(refRegistry.unstampSource()).catch((error: unknown) => {
        process.stderr.write(
          `[paste-layer-adapter] unstamp after pasteRef failed: ${String(error)}\n`,
        );
      });
    }
  } else if (target !== null && target !== undefined) {
    const scoped = within === undefined || within === null ? target : `${within} ${target}`;
    await page.locator(scoped).focus({ timeout: timeoutMs });
  }

  if (value !== null) {
    await page.evaluate(async (textToPaste) => {
      await navigator.clipboard.writeText(textToPaste);
    }, value);
  } else if (filePath !== null) {
    const rawExt = path.extname(filePath).toLowerCase();
    const ext = rawExt.startsWith('.') ? rawExt.slice(1) : rawExt;
    const mimeType =
      ext in pasteStatics.mimeTypes
        ? pasteStatics.mimeTypes[ext as keyof typeof pasteStatics.mimeTypes]
        : pasteStatics.mimeTypes.default;
    const buffer = readFileSync(filePath);
    const base64Data = buffer.toString('base64');
    await page.evaluate(
      async ({ base64, type }) => {
        const binaryString = atob(base64);
        const bytes = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
        const blob = new Blob([bytes], { type });
        const item = new ClipboardItem({ [type]: blob });
        await navigator.clipboard.write([item]);
      },
      { base64: base64Data, type: mimeType },
    );
  }

  await page.keyboard.press('ControlOrMeta+V');

  return { success: true as const };
};
