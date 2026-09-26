/**
 * PURPOSE: Pass-through for the npm package '@typescript-eslint/eslint-plugin'. Code outside the gateway imports @typescript-eslint/eslint-plugin
 * through here instead of the raw package, so a future guard or override on @typescript-eslint/eslint-plugin lands in
 * this one file and reaches every caller.
 *
 * @typescript-eslint/eslint-plugin's own declaration file uses `export = plugin;` — TypeScript
 * hard-refuses `export *` AND `export type *` against any `export =`-typed module (`TS2498`,
 * unconditional), so its three top-level properties are named explicitly rather than passed
 * through with a wildcard.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/@typescript-eslint/eslint-plugin';
 */

export { default } from '@typescript-eslint/eslint-plugin';
export { configs, meta, rules } from '@typescript-eslint/eslint-plugin';
