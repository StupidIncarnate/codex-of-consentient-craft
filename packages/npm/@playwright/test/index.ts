/**
 * PURPOSE: Pass-through for the npm package '@playwright/test'. Code outside the gateway imports @playwright/test
 * through here instead of the raw package, so a future guard or override on @playwright/test lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/@playwright/test';
 */

export * from '@playwright/test';
