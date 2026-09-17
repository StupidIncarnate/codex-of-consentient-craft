/**
 * PURPOSE: What `dungeonmaster siegelense snapshots --instance <id>`'s argv parses into — one
 * required field, because a snapshot belongs to exactly one instance's throwaway home and there is no
 * bare fleet-listing form to fall back on (unlike `status`, whose bare form lists the fleet). Reach
 * for this over a bare `InstanceId` so the responder's signature names the CALL's whole input shape
 * rather than one unlabelled identifier a reader has to trace back by context.
 *
 * USAGE:
 * snapshotsArgsContract.parse({ instanceId: 'inst_7f3a9c21' });
 * // Returns a validated SnapshotsArgs
 */

import { z } from 'zod';

import { instanceIdContract } from '../instance-id/instance-id-contract';

export const snapshotsArgsContract = z
  .object({
    instanceId: instanceIdContract,
  })
  .strict();

export type SnapshotsArgs = z.infer<typeof snapshotsArgsContract>;
