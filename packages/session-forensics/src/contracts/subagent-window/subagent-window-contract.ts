/**
 * PURPOSE: One sub-agent's live span, from spawn to completion. It is read off the transcript
 * file, not the `.meta.json`. `transformers/records-to-gaps` compares this against every turn gap
 * to tell time genuinely blocked on a sub-agent apart from time when nothing was running. Reach
 * for `subagentMetaContract` instead when you need the agent's type, model, or description rather
 * than when it ran.
 *
 * USAGE:
 * subagentWindowContract.parse({
 *   agentId: 'agent-abc',
 *   startedAt: '2026-09-01T19:09:06.542Z',
 *   endedAt: '2026-09-01T19:12:00.000Z',
 * });
 */
import { z } from 'zod';

import { agentIdContract } from '@dungeonmaster/shared/contracts';
import { isoTimestampContract } from '../iso-timestamp/iso-timestamp-contract';

export const subagentWindowContract = z
  .object({
    agentId: agentIdContract,
    startedAt: isoTimestampContract,
    endedAt: isoTimestampContract,
  })
  .brand<'SubagentWindow'>();

export type SubagentWindow = z.infer<typeof subagentWindowContract>;
