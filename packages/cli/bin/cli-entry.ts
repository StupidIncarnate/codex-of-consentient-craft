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

import { StartCli } from '../src/startup/start-cli';

const COMMAND_ARG_START_INDEX = 2;
const DIRNAME_TO_ROOT_DEPTH = '../../../..';

const [command] = process.argv.slice(COMMAND_ARG_START_INDEX);

const dungeonmasterRoot = filePathContract.parse(resolve(__dirname, DIRNAME_TO_ROOT_DEPTH));
const targetProjectRoot = filePathContract.parse(process.cwd());

StartCli({ command, context: { dungeonmasterRoot, targetProjectRoot } }).catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Error: ${errorMessage}\n`);
  process.exit(1);
});
