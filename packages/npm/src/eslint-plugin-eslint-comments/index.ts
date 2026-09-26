/**
 * PURPOSE: Pass-through for the npm package 'eslint-plugin-eslint-comments'. Code outside the gateway imports eslint-plugin-eslint-comments
 * through here instead of the raw package, so a future guard or override on eslint-plugin-eslint-comments lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/eslint-plugin-eslint-comments';
 */

export * from 'eslint-plugin-eslint-comments';
