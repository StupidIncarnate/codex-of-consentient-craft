/**
 * PURPOSE: CLI entry point for `adapter-census`, the report a planner runs before dispatching
 * adapter work: every adapter under `src/adapters/`, whether it only forwards to an existing
 * gateway export, who calls it, and which proxies have to move with it.
 *
 * USAGE:
 * await StartAdapterCensus();
 * // Delegates to AdapterCensusFlow with process.argv args
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { AdapterCensusFlow } from '../flows/adapter-census/adapter-census-flow';
import { argv } from '#gateway/node/process';

const COMMAND_LINE_ARG_START_INDEX = 2;

export const StartAdapterCensus = async (): Promise<AdapterResult> =>
  AdapterCensusFlow({ args: argv.slice(COMMAND_LINE_ARG_START_INDEX) });
