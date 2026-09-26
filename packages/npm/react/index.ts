/**
 * PURPOSE: Pass-through for the npm package 'react'. Code outside the gateway imports react
 * through here instead of the raw package, so a future guard or override on react lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/react';
 */

import mod = require('react');
export = mod;
