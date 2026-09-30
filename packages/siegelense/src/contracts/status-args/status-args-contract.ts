/**
 * PURPOSE: What `dungeonmaster siegelense status`'s argv parses into — `instanceId` is null for the
 * bare fleet listing and set for one instance in full, exactly like `statusQueryContract`; `isJson`
 * decides whether the responder reaches for the raw JSON default or `statusAnswerRenderTransformer`'s
 * table (siegelense-tooling.md line 2443, spec §3.A). Reach for this over `StatusQuery` once the
 * responder receives `--json`: `StatusQuery` is the MCP-era shape with no rendering opinion, and this
 * one carries the flag the CLI surface adds on top of it.
 *
 * USAGE:
 * statusArgsContract.parse({ instanceId: null, isJson: true });
 * // Returns a validated StatusArgs
 */

import { z } from '#gateway/npm/zod';

import { siegeInstanceContract } from '@dungeonmaster/shared/contracts';

export const statusArgsContract = z
  .object({
    instanceId: siegeInstanceContract.shape.id.nullable(),
    branch: z.string().brand<'StatusArgsBranch'>().nullable().optional(),
    since: z.enum(['1h', '6h', '1d', 'beginning']).nullable().optional(),
    isJson: z.boolean(),
  })
  .strict()
  .brand<'StatusArgs'>();

export type StatusArgs = z.infer<typeof statusArgsContract>;
