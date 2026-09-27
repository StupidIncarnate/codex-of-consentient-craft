/**
 * PURPOSE: Pass-through for the Node built-in 'events'. Code outside the gateway imports events
 * through here instead of the raw module, so a future guard or override on events lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/node/events';
 */

import mod = require('events');
export = mod;
