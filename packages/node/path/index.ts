/**
 * PURPOSE: Pass-through for the Node built-in 'path'. Code outside the gateway imports path
 * through here instead of the raw module, so a future guard or override on path lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/node/path';
 */

import mod = require('path');
export = mod;
