/**
 * PURPOSE: What `dungeonmaster siegelense kill --instance <id>`'s argv parses into — one required
 * field, because `kill` takes nothing else (siegelense-tooling.md line 2495). Reach for this over a
 * bare `InstanceId` so the responder's signature names the CALL's whole input shape rather than one
 * unlabelled identifier a reader has to trace back to `kill` by context.
 *
 * USAGE:
 * killArgsContract.parse({ instanceId: 'inst_7f3a9c21' });
 * // Returns a validated KillArgs
 */

import { z } from 'zod';

import { instanceIdContract } from '../instance-id/instance-id-contract';

export const killArgsContract = z
  .object({
    instanceId: instanceIdContract,
    json: z.boolean().default(false),
  })
  .strict();

export type KillArgs = z.infer<typeof killArgsContract>;
