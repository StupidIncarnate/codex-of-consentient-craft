/// <reference lib="dom" />
/**
 * PURPOSE: Pass-through for the browser global `XMLHttpRequest`. Code outside the gateway reaches
 * XMLHttpRequest through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { XMLHttpRequest } from '@dungeonmaster/browser/XMLHttpRequest';
 */

export const { XMLHttpRequest } = globalThis;
