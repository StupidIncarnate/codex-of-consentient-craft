/**
 * PURPOSE: What a caller may supply to make or set a quest — the whole quest shape minus the four
 * fields the server mints (`id`, `folder`, `createdAt`, `updatedAt`), plus the one foreign key the
 * record itself does not carry. Reach for this over its sibling, `questContract`, on a route's
 * INPUT side: a quest's parent is its FOLDER on disk, not a field on the record, so `guildId`
 * exists here only so the quest ingredient's `links` has somewhere to write it. `questContract`
 * itself stays the quest ingredient's `record` — what a route hands back once the row exists.
 *
 * USAGE:
 * questFieldsContract.parse({
 *   title: 'Quest 1',
 *   status: 'created',
 *   userRequest: 'seeded quest 1',
 *   guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 * });
 * // Returns QuestFields
 */
import type { z } from 'zod';

import { guildIdContract, questContract } from '@dungeonmaster/shared/contracts';

export const questFieldsContract = questContract
  .omit({ id: true, folder: true, createdAt: true, updatedAt: true })
  .extend({ guildId: guildIdContract });

export type QuestFields = z.infer<typeof questFieldsContract>;
