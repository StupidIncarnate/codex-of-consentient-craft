/**
 * PURPOSE: Validates input for the `siegelense-start` MCP tool — the lane spec to boot, and which
 * quest/guild the instance belongs to. `questId` and `guildId` are OMITTED, never sent as an explicit
 * `null`, by a caller with no quest to attribute an instance to (a session nobody dispatched); the
 * responder folds an omitted value to `null` before handing it to `instanceStartBroker`, which takes
 * `QuestId | null` / `GuildId | null` directly.
 *
 * USAGE:
 * siegelenseStartInputContract.parse({ specName: 'dungeonmaster-web' });
 * // Returns SiegelenseStartInput with questId and guildId both absent
 */

import { z } from 'zod';

import { guildIdContract, questIdContract } from '@dungeonmaster/shared/contracts';
import { specNameContract } from '@dungeonmaster/siegelense/contracts';

export const siegelenseStartInputContract = z
  .object({
    specName: specNameContract.describe(
      "The lane spec to boot, e.g. 'dungeonmaster-web' or 'dungeonmaster-headless'",
    ),
    questId: questIdContract
      .optional()
      .describe('The quest this instance belongs to. Omit for an instance no quest owns.'),
    guildId: guildIdContract
      .optional()
      .describe('The guild this instance belongs to. Omit for an instance no quest owns.'),
  })
  .strict();

export type SiegelenseStartInput = z.infer<typeof siegelenseStartInputContract>;
