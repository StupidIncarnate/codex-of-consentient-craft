/**
 * PURPOSE: Pass-through for the npm package '@mantine/core'. Code outside the gateway imports @mantine/core
 * through here instead of the raw package, so a future guard or override on @mantine/core lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/@mantine/core';
 */

export * from '@mantine/core';
