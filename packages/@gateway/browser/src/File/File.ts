/// <reference lib="dom" />
/**
 * PURPOSE: Pass-through for the browser global `File`. Code outside the gateway reaches
 * File through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { File } from '#gateway/browser/File';
 */

export const { File } = globalThis;
