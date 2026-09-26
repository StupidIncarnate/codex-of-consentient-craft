/**
 * PURPOSE: Pass-through for the npm package '@tabler/icons-react'. Code outside the gateway imports @tabler/icons-react
 * through here instead of the raw package, so a future guard or override on @tabler/icons-react lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/@tabler/icons-react';
 */

export * from '@tabler/icons-react';
