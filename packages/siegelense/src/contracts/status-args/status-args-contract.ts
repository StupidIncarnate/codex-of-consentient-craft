/**
 * PURPOSE: What `dungeonmaster siegelense status`'s argv parses into — `instanceId` is null for the
 * bare fleet listing and set for one instance in full, exactly like `statusQueryContract`; `human`
 * decides whether the responder reaches for `statusAnswerRenderTransformer`'s table or the JSON
 * default (siegelense-tooling.md line 2443, spec §3.A). Reach for this over `StatusQuery` once the
 * responder receives `--json`/`--human`: `StatusQuery` is the MCP-era shape with no rendering
 * opinion, and this one carries the flag the CLI surface adds on top of it.
 *
 * USAGE:
 * statusArgsContract.parse({ instanceId: null, human: false });
 * // Returns a validated StatusArgs
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { instanceIdContract } from '../instance-id/instance-id-contract';

export const statusArgsContract = z
  .object({
    instanceId: instanceIdContract.nullable(),
    branch: contentTextContract.nullable().optional(),
    since: z.enum(['1h', '6h', '1d', 'beginning']).nullable().optional(),
    human: z.boolean(),
  })
  .strict();

export type StatusArgs = z.infer<typeof statusArgsContract>;
