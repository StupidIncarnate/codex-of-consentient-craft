/**
 * PURPOSE: Public entry point for this package's guards surface — every downstream import
 * of '@dungeonmaster/siegelense/guards' resolves through this file.
 *
 * USAGE:
 * import { ... } from '@dungeonmaster/siegelense/guards';
 */

export * from './is-reserved-registry-entry/is-reserved-registry-entry-guard';
export * from './is-stale-registry-entry/is-stale-registry-entry-guard';
