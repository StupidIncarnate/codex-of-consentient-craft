/**
 * PURPOSE: The MCP input to `siegelense-status` — `{}` for the fleet listing and
 * `{ instance }` for one instance in full are the SAME shape, distinguished only by whether
 * `instanceId` is null (spec line 2376). `.strict()` rejects any other key by name rather than
 * silently ignoring it, since this is parsed straight from untrusted tool-call input. Reach for
 * this over `resultsQueryContract` — that one requires an instance; this one's whole point is that
 * it does not.
 *
 * USAGE:
 * statusQueryContract.parse({ instanceId: null });
 * // Returns a validated StatusQuery for the fleet form
 */

import { z } from 'zod';

import { instanceIdContract } from '../instance-id/instance-id-contract';

export const statusQueryContract = z
  .object({
    instanceId: instanceIdContract.nullable(),
  })
  .strict();

export type StatusQuery = z.infer<typeof statusQueryContract>;
