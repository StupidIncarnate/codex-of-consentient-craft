/**
 * PURPOSE: Pass-through for the npm package 'eslint-plugin-jest'. Code outside the gateway imports eslint-plugin-jest
 * through here instead of the raw package, so a future guard or override on eslint-plugin-jest lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/eslint-plugin-jest';
 */

import mod = require('eslint-plugin-jest');
export = mod;
