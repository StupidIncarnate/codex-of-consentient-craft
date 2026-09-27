/**
 * PURPOSE: Pass-through for the npm package '@mantine/notifications'. Code outside the gateway imports @mantine/notifications
 * through here instead of the raw package, so a future guard or override on @mantine/notifications lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/mantine__notifications';
 */

export * from '@mantine/notifications';
