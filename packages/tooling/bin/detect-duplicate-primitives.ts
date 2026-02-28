#!/usr/bin/env node

/**
 * PURPOSE: Thin CLI entry point that invokes the duplicate primitive detection startup
 *
 * USAGE:
 * npx detect-duplicate-primitives --pattern="**\/*.ts" --threshold=3
 * // Scans for duplicate string and regex literals and reports findings to stdout
 */

import { StartPrimitiveDuplicateDetection } from '../src/startup/start-primitive-duplicate-detection';

StartPrimitiveDuplicateDetection().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Error: ${errorMessage}\n`);
  process.exit(1);
});
