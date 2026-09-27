/**
 * PURPOSE: Pass-through for the npm package '@typescript-eslint/typescript-estree'. Code outside the gateway imports
 * @typescript-eslint/typescript-estree through here instead of the raw package, so a future guard or override on
 * @typescript-eslint/typescript-estree lands in this one file and reaches every caller. Used inside this gateway
 * package itself by `parseAndFindNode` (for `simpleTraverse`'s parent-link side effect), which imports the raw
 * package directly rather than through this barrel — the same "a wrapper imports the raw package it wraps" pattern
 * every other subpath in this gateway follows.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/typescript-eslint__typescript-estree';
 */

export * from '@typescript-eslint/typescript-estree';
