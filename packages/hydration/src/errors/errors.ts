/**
 * PURPOSE: Public entry point for this package's errors surface — every downstream import
 * of '@dungeonmaster/hydration/errors' resolves through this file.
 *
 * USAGE:
 * import { ... } from '@dungeonmaster/hydration/errors';
 */

export * from './http-envelope-failure/http-envelope-failure-error';
export * from './hydration-filter-expectation/hydration-filter-expectation-error';
export * from './hydration-nested-ingredient-unregistered/hydration-nested-ingredient-unregistered-error';
export * from './hydration-query-failed/hydration-query-failed-error';
export * from './hydration-record-shape/hydration-record-shape-error';
export * from './hydration-removed-handle-verb/hydration-removed-handle-verb-error';
export * from './hydration-route-failed/hydration-route-failed-error';
export * from './hydration-route-unavailable/hydration-route-unavailable-error';
export * from './hydration-route-verb-unavailable/hydration-route-verb-unavailable-error';
export * from './hydration-saved-field-missing/hydration-saved-field-missing-error';
export * from './hydration-saved-record-missing/hydration-saved-record-missing-error';
export * from './hydration-transaction-rolled-back/hydration-transaction-rolled-back-error';
export * from './hydration-transition-refused/hydration-transition-refused-error';
export * from './hydration-transition-unreachable/hydration-transition-unreachable-error';
export * from './hydration-unlinked-row/hydration-unlinked-row-error';
export * from './hydration-write-failed/hydration-write-failed-error';
export * from './ingredient-declaration/ingredient-declaration-error';
export * from './registry-dangling-link/registry-dangling-link-error';
export * from './registry-duplicate-name/registry-duplicate-name-error';
