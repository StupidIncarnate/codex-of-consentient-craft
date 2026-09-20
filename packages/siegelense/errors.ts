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
export * from './src/errors/shot-dimension-mismatch/shot-dimension-mismatch-error';
export * from './src/errors/run-id-required/run-id-required-error';
export * from './src/errors/unknown-result-kind/unknown-result-kind-error';
export * from './src/errors/http-request-failed/http-request-failed-error';
export * from './src/errors/step-file-not-found/step-file-not-found-error';
