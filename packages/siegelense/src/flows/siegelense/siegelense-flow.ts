/**
 * PURPOSE: Routes `dungeonmaster siegelense`'s two jobs to their responders — `driver --instance
 * <id>` runs the driver process for one instance until it is killed or goes idle, and the bare
 * invocation prints the fleet for a person at a terminal (siegelense-tooling.md lines 288-291). A
 * flow holds no branching logic of its own beyond this route table, exactly as CliFlow does.
 *
 * USAGE:
 * await SiegelenseFlow({ args: ['driver', '--instance', 'inst_7f3a9c21'] });
 * // Routes to SiegelenseDriverResponder
 *
 * await SiegelenseFlow({ args: [] });
 * // Routes to SiegelenseFleetResponder
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { instanceIdContract } from '../../contracts/instance-id/instance-id-contract';
import { SiegelenseDriverResponder } from '../../responders/siegelense/driver/siegelense-driver-responder';
import { SiegelenseFleetResponder } from '../../responders/siegelense/fleet/siegelense-fleet-responder';

const COMMANDS = { driver: 'driver' } as const;
const INSTANCE_FLAG = '--instance';

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

  return SiegelenseFleetResponder();
};
