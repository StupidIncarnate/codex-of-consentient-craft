/**
 * PURPOSE: Pass-through for the Node built-in 'crypto'. Code outside the gateway imports crypto
 * through here instead of the raw module, so a future guard or override on crypto lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { randomUUID, createHash } from '#gateway/node/crypto';
 */

export * from 'crypto';
