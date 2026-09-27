/**
 * PURPOSE: Pass-through for the npm package '@typescript-eslint/parser'. Code outside the gateway imports @typescript-eslint/parser
 * through here instead of the raw package, so a future guard or override on @typescript-eslint/parser lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/typescript-eslint__parser';
 */

export * from '@typescript-eslint/parser';
