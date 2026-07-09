/**
 * PURPOSE: One actively-executing quest paired with its guild context, as produced by the shared
 * `questActiveQuestsBroker` disk discovery. Both consumers of that discovery read this shape: the
 * execution queue (`ExecutionQueueGetAllResponder`) renders the FIFO list of these, and
 * `questGetNextStepBroker` dispatches the head's `quest`. The guild fields are captured during the
 * guild-by-guild disk scan so neither consumer has to re-resolve a quest's owning guild.
 *
 * USAGE:
 * activeQuestEntryContract.parse({ quest, guildId, guildSlug });
 * // Returns: ActiveQuestEntry
 */

import { z } from 'zod';

import { guildIdContract, questContract, urlSlugContract } from '@dungeonmaster/shared/contracts';

export const activeQuestEntryContract = z.object({
  quest: questContract,
  guildId: guildIdContract,
  guildSlug: urlSlugContract,
});

export type ActiveQuestEntry = z.infer<typeof activeQuestEntryContract>;
