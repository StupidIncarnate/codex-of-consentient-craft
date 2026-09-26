/**
 * PURPOSE: Pass-through for the Node built-in 'util/types'. Code outside the gateway imports
 * util/types through here instead of the raw module, so a future guard or override on it lands
 * in this one file and reaches every caller.
 *
 * USAGE:
 * import { isNativeError } from '@dungeonmaster/node/util/types';
 */

export * from 'util/types';
