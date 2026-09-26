/**
 * PURPOSE: Pass-through for the npm package '@testing-library/react'. Code outside the gateway imports @testing-library/react
 * through here instead of the raw package, so a future guard or override on @testing-library/react lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/@testing-library/react';
 */

export * from '@testing-library/react';
