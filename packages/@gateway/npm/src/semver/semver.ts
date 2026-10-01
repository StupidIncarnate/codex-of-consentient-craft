/**
 * PURPOSE: Pass-through for the npm package 'semver'. Code outside the gateway imports semver
 * through here instead of the raw package, so a future guard or override on semver lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { satisfies } from '#gateway/npm/semver';
 */

export * from 'semver';
