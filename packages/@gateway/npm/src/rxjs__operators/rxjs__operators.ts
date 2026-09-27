/**
 * PURPOSE: Pass-through for the npm package 'rxjs/operators'. Code outside the gateway imports rxjs/operators
 * through here instead of the raw package, so a future guard or override on rxjs/operators lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/rxjs__operators';
 */

export * from 'rxjs/operators';
