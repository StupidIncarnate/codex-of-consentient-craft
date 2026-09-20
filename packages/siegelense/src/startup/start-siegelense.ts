/**
 * PURPOSE: The CLI's whole entry into this package — takes the raw args after `siegelense` and
 * delegates to `SiegelenseFlow`, which routes `--help`/`-h`, the seven built calls (`start`, `run`,
 * `results`, `kill`, `status`, `cleanup`, `compare`), `driver --instance <id>`, and the bare
 * fleet-listing invocation to their responders. `CliSiegelenseResponder` reaches this through
 * `runtimeDynamicImportAdapter`, dynamically rather than statically, so Playwright — pulled in by
 * this package's own lane-boot path — never enters the CLI's esbuild bundle.
 *
 * USAGE:
 * await StartSiegelense({ args: [] });
 * // Prints the fleet
 *
 * await StartSiegelense({ args: ['--help'] });
 * // Prints the index: one line per built call, plus the six not built yet
 *
 * await StartSiegelense({ args: ['start', '--spec', 'dungeonmaster-stack'] });
 * // Boots an instance and prints its manifest
 *
 * await StartSiegelense({ args: ['run', '--instance', 'inst_7f3a9c21', '--steps', '[...]'] });
 * // Submits a batch of steps and blocks for a status, never the steps' own payloads
 *
 * await StartSiegelense({ args: ['results', '--instance', 'inst_7f3a9c21', '--run', 'run_2'] });
 * // Reads evidence off disk for that run. Starts nothing
 *
 * await StartSiegelense({ args: ['kill', '--instance', 'inst_7f3a9c21'] });
 * // Tears the instance down, or reaps an already-dead one's orphans
 *
 * await StartSiegelense({ args: ['driver', '--instance', 'inst_7f3a9c21'] });
 * // Runs the driver for that instance until it is killed or goes idle
 *
 * await StartSiegelense({ args: ['status'] });
 * // Prints the machine block, the monitored list, and one line per instance
 *
 * await StartSiegelense({ args: ['status', '--instance', 'inst_7f3a9c21'] });
 * // Prints that instance in full: last beat, last step, RSS, orphans, evidence paths, likelyCause
 *
 * await StartSiegelense({ args: ['cleanup'] });
 * // Reaps stale instances and prints what was reaped, released, and left alone
 *
 * await StartSiegelense({ args: ['compare', '--instance', 'inst_7f3a9c21', '--run-a', 'run_1', '--run-b', 'run_2'] });
 * // Diffs two runs of the same instance's timeline
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { SiegelenseFlow } from '../flows/siegelense/siegelense-flow';

export const StartSiegelense = async ({
  args,
}: {
  args: readonly string[];
}): Promise<AdapterResult> => SiegelenseFlow({ args });
