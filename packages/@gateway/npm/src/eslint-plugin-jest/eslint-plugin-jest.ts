/**
 * PURPOSE: Pass-through for the npm package 'eslint-plugin-jest'. Code outside the gateway imports eslint-plugin-jest
 * through here instead of the raw package, so a future guard or override on eslint-plugin-jest lands in
 * this one file and reaches every caller.
 *
 * eslint-plugin-jest's own declaration file uses `export = plugin;` — TypeScript hard-refuses
 * `export *` AND `export type *` against any `export =`-typed module (`TS2498`, unconditional),
 * so its four top-level properties are named explicitly rather than passed through with a
 * wildcard.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/eslint-plugin-jest';
 */

export { default } from 'eslint-plugin-jest';
export { configs, environments, meta } from 'eslint-plugin-jest';
export { rules } from './rules/rules';
