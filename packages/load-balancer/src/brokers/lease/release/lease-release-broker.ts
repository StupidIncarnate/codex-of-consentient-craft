/**
 * PURPOSE: Releases and deletes a coordination lease from the registry upon process completion or shutdown.
 * Reach for this in finally blocks or shutdown hooks when a ward child or siegelense instance terminates cleanly.
 *
 * USAGE:
 * await leaseReleaseBroker({ leaseId: 'lease-123' });
 * // Deletes the row matching leaseId from the leases table
 */

import { registryOpenBroker } from '../../registry/open/registry-open-broker';

export const leaseReleaseBroker = async ({ leaseId }: { leaseId: string }): Promise<void> => {
  const database = registryOpenBroker();
  const statement = database.prepare('DELETE FROM leases WHERE lease_id = ?;');
  statement.run(leaseId);
  return Promise.resolve();
};
