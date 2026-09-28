#!/usr/bin/env node

/**
 * PURPOSE: Thin CLI entry point that invokes the adapter census startup
 *
 * USAGE:
 * npx adapter-census --format=json --package=siegelense
 * // Prints every remaining adapter per package: its shape, its callers, the proxies composing
 * // their proxies, and which of those stage a catch-all
 */

import { StartAdapterCensus } from '../src/startup/start-adapter-census';

StartAdapterCensus().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Error: ${errorMessage}\n`);
  process.exit(1);
});
