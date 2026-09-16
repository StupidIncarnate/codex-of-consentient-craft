/**
 * PURPOSE: Public entry point for this package's errors surface — every downstream import
 * of '@dungeonmaster/hydration/errors' resolves through this file.
 *
 * USAGE:
 * import { ... } from '@dungeonmaster/hydration/errors';
 */

export * from './src/errors/hydration-filter-expectation/hydration-filter-expectation-error';
export * from './src/errors/hydration-query-failed/hydration-query-failed-error';
export * from './src/errors/hydration-record-shape/hydration-record-shape-error';
export * from './src/errors/hydration-route-failed/hydration-route-failed-error';
export * from './src/errors/hydration-route-unavailable/hydration-route-unavailable-error';
export * from './src/errors/hydration-route-verb-unavailable/hydration-route-verb-unavailable-error';
export * from './src/errors/hydration-saved-record-missing/hydration-saved-record-missing-error';
export * from './src/errors/hydration-transaction-rolled-back/hydration-transaction-rolled-back-error';
export * from './src/errors/hydration-transition-refused/hydration-transition-refused-error';
export * from './src/errors/hydration-transition-unreachable/hydration-transition-unreachable-error';
export * from './src/errors/hydration-unlinked-row/hydration-unlinked-row-error';
export * from './src/errors/hydration-write-failed/hydration-write-failed-error';
export * from './src/errors/ingredient-declaration/ingredient-declaration-error';
export * from './src/errors/registry-dangling-link/registry-dangling-link-error';
export * from './src/errors/registry-duplicate-name/registry-duplicate-name-error';
