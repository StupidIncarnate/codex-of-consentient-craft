#!/usr/bin/env node

/**
 * PURPOSE: Main entry point that exports the duplicate detection CLI startup function.
 *
 * USAGE:
 * import { StartPrimitiveDuplicateDetection } from '@questmaestro/tooling';
 * await StartPrimitiveDuplicateDetection();
 * // Returns: void (executes CLI command for detecting duplicate primitives)
 */
export { StartPrimitiveDuplicateDetection } from './startup/start-primitive-duplicate-detection';
