/**
 * PURPOSE: Routes `dungeonmaster siegelense`'s jobs to their responders — `driver --instance <id>`
 * runs the driver process for one instance until it is killed or goes idle, `status [--instance
 * <id>]` prints the fleet or one instance in full, `cleanup` reaps stale instances, and the bare
 * invocation prints the fleet for a person at a terminal (siegelense-tooling.md lines 288-291).
 * `SiegelenseFlow` is the source of truth for every subcommand and for `--instance`, independent of
 * `CliSiegelenseResponder`'s own cheap pre-check one file up, so it validates both itself: a `status
 * --instance` whose value is missing or looks like another flag throws instead of silently falling
 * back to the fleet listing, and a subcommand outside this route table throws naming it rather than
 * matching no branch and rendering the bare-invocation output.
 *
 * USAGE:
 * await SiegelenseFlow({ args: ['driver', '--instance', 'inst_7f3a9c21'] });
 * // Routes to SiegelenseDriverResponder
 *
 * await SiegelenseFlow({ args: ['status', '--instance', 'inst_7f3a9c21'] });
 * // Routes to SiegelenseStatusResponder, named
 *
 * await SiegelenseFlow({ args: ['cleanup'] });
 * // Routes to SiegelenseCleanupResponder
 *
 * await SiegelenseFlow({ args: [] });
 * // Routes to SiegelenseFleetResponder
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { instanceIdContract } from '../../contracts/instance-id/instance-id-contract';
import { SiegelenseCleanupResponder } from '../../responders/siegelense/cleanup/siegelense-cleanup-responder';
import { SiegelenseDriverResponder } from '../../responders/siegelense/driver/siegelense-driver-responder';
import { SiegelenseFleetResponder } from '../../responders/siegelense/fleet/siegelense-fleet-responder';
import { SiegelenseStatusResponder } from '../../responders/siegelense/status/siegelense-status-responder';

const COMMANDS = { cleanup: 'cleanup', driver: 'driver', status: 'status' } as const;
const INSTANCE_FLAG = '--instance';
// `dungeonmaster siegelense` is the only way a person reaches this flow, so the usage line names that
// binary rather than the flow. A bare `siegelense` is not a command, and a reader who copies this line
// out of an error message runs what it says.
const USAGE =
  'Usage: dungeonmaster siegelense [driver --instance <instanceId> | status [--instance <instanceId>] | cleanup]';

export const SiegelenseFlow = async ({
  args,
}: {
  args: readonly string[];
}): Promise<AdapterResult> => {
  if (args[0] === COMMANDS.driver) {
    const flagIndex = args.indexOf(INSTANCE_FLAG);
    const rawInstanceId = flagIndex === -1 ? undefined : args[flagIndex + 1];
    const instanceId = instanceIdContract.parse(rawInstanceId);
    return SiegelenseDriverResponder({ instanceId });
  }

  if (args[0] === COMMANDS.status) {
    const flagIndex = args.indexOf(INSTANCE_FLAG);
    if (flagIndex === -1) {
      return SiegelenseStatusResponder({ instanceId: null });
    }
    const rawInstanceId = args[flagIndex + 1];
    if (rawInstanceId === undefined || rawInstanceId.startsWith('--')) {
      throw new Error(
        `${INSTANCE_FLAG} is required: it cannot be missing, and the value cannot itself start ` +
          `with "--".\n\n${USAGE}`,
      );
    }
    const instanceId = instanceIdContract.parse(rawInstanceId);
    return SiegelenseStatusResponder({ instanceId });
  }

  if (args[0] === COMMANDS.cleanup) {
    return SiegelenseCleanupResponder();
  }

  if (args[0] !== undefined) {
    throw new Error(`Unknown siegelense subcommand: ${args[0]}\n\n${USAGE}`);
  }

  return SiegelenseFleetResponder();
};
