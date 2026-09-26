/**
 * PURPOSE: Pass-through for the npm package '@typescript-eslint/eslint-plugin'. Code outside the gateway imports @typescript-eslint/eslint-plugin
 * through here instead of the raw package, so a future guard or override on @typescript-eslint/eslint-plugin lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/@typescript-eslint/eslint-plugin';
 */

import mod = require('@typescript-eslint/eslint-plugin');
export = mod;
