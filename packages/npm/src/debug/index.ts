/**
 * PURPOSE: Pass-through for the npm package 'debug'. Code outside the gateway imports debug
 * through here instead of the raw package, so a future guard or override on debug lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/debug';
 */

import mod = require('debug');
export = mod;
