/**
 * PURPOSE: Records a restarted lane's NEW process-group ids on its `registry.json` row. `kill`'s
 * orphan reap and `status`'s live memory both read `pgids` off the row rather than asking the driver,
 * so a row still naming the groups a `reset level: 'instance'` restart just killed would leave the
 * respawned servers unreapable and unmeasured. The boot-time stamp stays in
 * `SiegelenseDriverResponder`, alongside the pid and socket path only a boot mints; this layer
 * rewrites `pgids` alone.
 *
 * USAGE:
 * await pgidsStampLayerBroker({ instanceId: InstanceIdStub(), pgids: [ProcessGroupIdStub({ value: 2001 })] });
 * // Rewrites that row's pgids; every other row and field is left as it was
 */

import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import type { ProcessGroupId } from '../../../contracts/process-group-id/process-group-id-contract';
import type { Registry } from '../../../contracts/registry/registry-contract';
import { registryUpdateBroker } from '../../registry/update/registry-update-broker';

export const pgidsStampLayerBroker = async ({
  instanceId,
  pgids,
}: {
  instanceId: InstanceId;
  pgids: readonly ProcessGroupId[];
}): Promise<Registry> =>
  registryUpdateBroker({
    mutate: (current) => ({
      instances: current.instances.map((row) => (row.id === instanceId ? { ...row, pgids } : row)),
    }),
  });
