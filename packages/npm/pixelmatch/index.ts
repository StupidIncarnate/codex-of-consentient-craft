/**
 * PURPOSE: Pass-through for the npm package 'pixelmatch'. Code outside the gateway imports pixelmatch
 * through here instead of the raw package, so a future guard or override on pixelmatch lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/pixelmatch';
 */

import mod = require('pixelmatch');
export = mod;
