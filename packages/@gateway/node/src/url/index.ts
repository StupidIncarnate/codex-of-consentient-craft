/**
 * PURPOSE: Pass-through for the Node built-in 'url'. Code outside the gateway imports url
 * through here instead of the raw module, so a future guard or override on url lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/node/url';
 */

export * from 'url';
