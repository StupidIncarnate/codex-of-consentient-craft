/**
 * PURPOSE: Pass-through for the npm package 'rxjs'. Code outside the gateway imports rxjs
 * through here instead of the raw package, so a future guard or override on rxjs lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/rxjs';
 */

export * from 'rxjs';
