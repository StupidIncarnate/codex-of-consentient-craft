/**
 * PURPOSE: Parses a raw instance id string and delegates to DriverFlow. This is the direct,
 * programmatically-testable entry a session can call in-process; the production launch vector is
 * `dungeonmaster siegelense driver --instance <id>`, which reaches `SiegelenseFlow`'s own `driver`
 * route (not this file) through the CLI's dynamic import of `StartSiegelense`. `instanceIdContract`
 * is the boundary — the raw string arriving here is `unknown` in shape until this call brands it.
 * Resolves with nothing once the driver has exited.
 *
 * USAGE:
 * await StartSiegelenseDriver({ instanceId: 'inst_7f3a9c21' });
 * // Boots that instance's lane and blocks for the driver's whole life
 */

import { instanceIdContract } from '../contracts/instance-id/instance-id-contract';
import { DriverFlow } from '../flows/driver/driver-flow';

export const StartSiegelenseDriver = async ({
  instanceId,
}: {
  instanceId: string;
}): Promise<void> => DriverFlow({ instanceId: instanceIdContract.parse(instanceId) });
