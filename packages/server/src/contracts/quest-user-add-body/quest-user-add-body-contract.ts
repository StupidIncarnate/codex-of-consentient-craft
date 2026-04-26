/**
 * PURPOSE: Defines the validated body shape for the quest-user-add responder
 *
 * USAGE:
 * const { title, userRequest, guildId } = questUserAddBodyContract.parse(body);
 * // Returns: { title: string, userRequest: string, guildId: GuildId }
 */

import { z } from 'zod';
import { guildIdContract } from '@dungeonmaster/shared/contracts';

export const questUserAddBodyContract = z.object({
  title: z.string().min(1).brand<'QuestTitle'>(),
  userRequest: z.string().min(1).brand<'UserRequest'>(),
  guildId: guildIdContract,
});

export type QuestUserAddBody = z.infer<typeof questUserAddBodyContract>;
