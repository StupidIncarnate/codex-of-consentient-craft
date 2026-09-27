/**
 * PURPOSE: Pass-through for the npm package '@testing-library/user-event'. Code outside the gateway imports @testing-library/user-event
 * through here instead of the raw package, so a future guard or override on @testing-library/user-event lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/testing-library__user-event';
 */

export * from '@testing-library/user-event';
export { default } from '@testing-library/user-event';
