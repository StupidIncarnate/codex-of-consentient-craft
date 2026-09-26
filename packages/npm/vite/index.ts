/**
 * PURPOSE: Pass-through for the npm package 'vite'. Code outside the gateway imports vite
 * through here instead of the raw package, so a future guard or override on vite lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/vite';
 */

export * from 'vite';
