/// <reference lib="dom" />
/**
 * PURPOSE: Pass-through for the browser global `Text`. Code outside the gateway reaches
 * Text through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { Text } from '#gateway/browser/Text';
 */

export const { Text } = globalThis;
