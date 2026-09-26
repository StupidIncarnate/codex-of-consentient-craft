/// <reference lib="dom" />
/**
 * PURPOSE: Pass-through for the browser global `FileReader`. Code outside the gateway reaches
 * FileReader through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { FileReader } from '@dungeonmaster/browser/FileReader';
 */

export const { FileReader } = globalThis;
