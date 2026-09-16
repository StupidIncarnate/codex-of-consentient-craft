/**
 * PURPOSE: The CLI's whole entry into this package — takes the raw args after `siegelense` and
 * delegates to SiegelenseFlow, which routes `driver --instance <id>`, `status [--instance <id>]`,
 * `cleanup`, and the bare fleet-listing invocation to their responders. `CliSiegelenseResponder`
 * reaches this through `runtimeDynamicImportAdapter`, dynamically rather than statically, so
 * Playwright — pulled in by this package's own lane-boot path — never enters the CLI's esbuild
 * bundle.
 *
 * USAGE:
 * await StartSiegelense({ args: [] });
 * // Prints the fleet
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
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { SiegelenseFlow } from '../flows/siegelense/siegelense-flow';

export const StartSiegelense = async ({
  args,
}: {
  args: readonly string[];
}): Promise<AdapterResult> => SiegelenseFlow({ args });
