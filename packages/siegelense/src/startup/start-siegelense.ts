/**
 * PURPOSE: The CLI's whole entry into this package — takes the raw args after `siegelense` and
 * delegates to `SiegelenseFlow`, which routes `--help`/`-h`, every built call, `driver --instance
 * <id>`, and the bare invocation (`args: []`, which reaches `SiegelenseStatusLayerFlow` with no
 * flags — the same table `status` alone prints, never a second fleet view) to their responders.
 * `SiegelenseFlow` is also where the `process.stdout` EPIPE guard lives (a startup file must not
 * branch, so that logic sits one layer down, in the flow every call — including this one — funnels
 * through). `CliSiegelenseResponder` reaches this through `runtimeDynamicImportAdapter`,
 * dynamically rather than statically, so Playwright — pulled in by this package's own lane-boot
 * path — never enters the CLI's esbuild bundle.
 *
 * USAGE:
 * await StartSiegelense({ args: [] });
 * // Prints the same fleet table `status` (no flags) prints
 *
 * await StartSiegelense({ args: ['--help'] });
 * // Prints the index: one line per built call
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
