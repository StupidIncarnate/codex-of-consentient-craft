/**
 * PURPOSE: Wraps the browser Clipboard API `navigator.clipboard.writeText` so widgets can copy text to the system clipboard without depending directly on the global navigator object
 *
 * USAGE:
 * await clipboardWriteAdapter({text: '/dumpster-launch'});
 * // Resolves to {success: true} once the platform has accepted the write.
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const clipboardWriteAdapter = async ({ text }: { text: string }): Promise<AdapterResult> => {
  await globalThis.navigator.clipboard.writeText(text);

  return { success: true as const };
};
