/**
 * PURPOSE: Pass-through for the Node built-in 'util'. Code outside the gateway imports util
 * through here instead of the raw module, so a future guard or override on util lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/node/util';
 */

export * from 'util';
