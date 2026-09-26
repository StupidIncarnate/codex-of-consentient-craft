/**
 * PURPOSE: Pass-through for the npm package '@typescript-eslint/utils'. Code outside the gateway imports @typescript-eslint/utils
 * through here instead of the raw package, so a future guard or override on @typescript-eslint/utils lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/@typescript-eslint/utils';
 */

export * from '@typescript-eslint/utils';
