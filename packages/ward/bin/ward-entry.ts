#!/usr/bin/env node

/**
 * PURPOSE: Thin CLI entry point that delegates to StartWard startup
 *
 * USAGE:
 * node ward-entry.js          // Runs ward (default: run subcommand)
 * node ward-entry.js list     // Lists errors from last run
 * node ward-entry.js detail   // Shows detailed errors for a file
 * node ward-entry.js raw      // Shows raw tool output
 */

import { StartWard } from '../src/startup/start-ward';

StartWard({ args: process.argv }).catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Error: ${errorMessage}\n`);
  process.exit(1);
});
