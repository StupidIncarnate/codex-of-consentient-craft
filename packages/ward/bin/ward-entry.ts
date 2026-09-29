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

import { argv, exit, stderr } from '#gateway/node/process';

import { StartWard } from '../src/startup/start-ward';

StartWard({ args: argv }).catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  stderr.write(`Error: ${errorMessage}\n`);
  exit(1);
});
