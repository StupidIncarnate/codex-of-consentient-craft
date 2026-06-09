#!/usr/bin/env node

/**
 * PURPOSE: Thin CLI entry point that constructs install context and delegates to StartCli startup
 *
 * USAGE:
 * node cli-entry.js init   // Runs install across all packages
 * node cli-entry.js        // Launches HTTP server and opens browser
 */

import { resolve } from 'path';

import { filePathContract } from '@dungeonmaster/shared/contracts';
import { processCwdAdapter } from '@dungeonmaster/shared/adapters';

import { StartCli } from '../src/startup/start-cli';

const COMMAND_ARG_START_INDEX = 2;
const DIRNAME_TO_ROOT_DEPTH = '../../../..';

// Only auto-run the CLI when this file is the process entry point (`dungeonmaster` /
// `node dungeonmaster.js`). When the built bin is imported/required instead — e.g. the
// cli-bin integration test loading it to verify it is a valid module — `require.main` is the
// importer, not this module, so the serve command (which boots the HTTP server and opens a
// browser) must NOT fire. esbuild emits this entry at the bundle's top level, so `module` and
// `require.main` here are the real Node CommonJS values, not a wrapped-module shim.
if (require.main === module) {
  const [command] = process.argv.slice(COMMAND_ARG_START_INDEX);

  const dungeonmasterRoot = filePathContract.parse(resolve(__dirname, DIRNAME_TO_ROOT_DEPTH));
  const targetProjectRoot = processCwdAdapter();

  StartCli({ command, context: { dungeonmasterRoot, targetProjectRoot } }).catch(
    (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Error: ${errorMessage}\n`);
      process.exit(1);
    },
  );
}
