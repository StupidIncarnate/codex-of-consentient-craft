/**
 * PURPOSE: Public entry point for this package's errors surface — every downstream import
 * of '@dungeonmaster/siegelense/errors' resolves through this file.
 *
 * USAGE:
 * import { ... } from '@dungeonmaster/siegelense/errors';
 */

export * from './boot-lock-held/boot-lock-held-error';
export * from './registry-unreadable/registry-unreadable-error';
export * from './port-claim-exhausted/port-claim-exhausted-error';
export * from './shot-dimension-mismatch/shot-dimension-mismatch-error';
export * from './run-id-required/run-id-required-error';
export * from './unknown-result-kind/unknown-result-kind-error';
export * from './http-request-failed/http-request-failed-error';
export * from './step-file-not-found/step-file-not-found-error';
