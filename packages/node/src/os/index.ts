/**
 * PURPOSE: Pass-through for the Node built-in 'os'. Code outside the gateway imports os
 * through here instead of the raw module, so a future guard or override on os lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { homedir, tmpdir } from '@dungeonmaster/node/os';
 */

export * from 'os';
