/**
 * PURPOSE: Pass-through for the browser global `sessionStorage`. Code outside the gateway reaches
 * sessionStorage through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { sessionStorage } from '@dungeonmaster/browser/sessionStorage';
 */

export const { sessionStorage } = globalThis;
