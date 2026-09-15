/**
 * PURPOSE: Public entry point for this package's errors surface — every downstream import
 * of '@dungeonmaster/siegelense/errors' resolves through this file.
 *
 * USAGE:
 * import { ... } from '@dungeonmaster/siegelense/errors';
 */

export * from './src/errors/boot-lock-held/boot-lock-held-error';
export * from './src/errors/registry-unreadable/registry-unreadable-error';
export * from './src/errors/port-claim-exhausted/port-claim-exhausted-error';
