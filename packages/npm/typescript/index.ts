/**
 * PURPOSE: Pass-through for the npm package 'typescript'. Code outside the gateway imports typescript
 * through here instead of the raw package, so a future guard or override on typescript lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/typescript';
 */

import mod = require('typescript');
export = mod;
