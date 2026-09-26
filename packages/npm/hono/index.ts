/**
 * PURPOSE: Pass-through for the npm package 'hono'. Code outside the gateway imports hono
 * through here instead of the raw package, so a future guard or override on hono lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/hono';
 */

export * from 'hono';
