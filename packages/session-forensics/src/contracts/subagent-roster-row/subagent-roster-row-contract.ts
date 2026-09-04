/**
 * PURPOSE: One sub-agent's fan-out cost and lifespan, joined from its `.meta.json` and its own
 * transcript. Neither file alone answers what a dispatch spent. Reach for this over
 * `subagentMetaContract` when the caller needs the turn count or the loaded records. Reach for
 * this over `subagentWindowContract` when the transcript might hold no timestamped record at all.
 *
 * USAGE:
 * subagentRosterRowContract.parse({
 *   agentId: 'agent-abc', meta: SubagentMetaStub(), turnCount: 3, records: [],
 * });
 * // Returns the branded SubagentRosterRow. startedAt and endedAt are optional here — where
 * // SubagentWindow requires both — because the transcript may hold no timestamped record at all.
 */
import { z } from 'zod';

import { agentIdContract } from '@dungeonmaster/shared/contracts';
import { subagentMetaContract } from '../subagent-meta/subagent-meta-contract';
import { isoTimestampContract } from '../iso-timestamp/iso-timestamp-contract';
import { transcriptRecordContract } from '../transcript-record/transcript-record-contract';

export const subagentRosterRowContract = z
  .object({
    agentId: agentIdContract,
    meta: subagentMetaContract,
    startedAt: isoTimestampContract.optional(),
    endedAt: isoTimestampContract.optional(),
    turnCount: z.number().int().nonnegative(),
    records: z.array(transcriptRecordContract),
  })
  .brand<'SubagentRosterRow'>();

export type SubagentRosterRow = z.infer<typeof subagentRosterRowContract>;
