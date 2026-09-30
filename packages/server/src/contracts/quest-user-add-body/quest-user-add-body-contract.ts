/**
 * PURPOSE: Defines the validated body shape for the quest-user-add responder
 *
 * USAGE:
 * const { title, userRequest, guildId } = questUserAddBodyContract.parse(body);
 * // Returns: { title: string, userRequest: string, guildId: GuildId }
 */

import { z } from '#gateway/npm/zod';
import { guildContract } from '@dungeonmaster/shared/contracts';

export const questUserAddBodyContract = z.object({
  title: z.string().min(1).brand<'QuestUserAddBodyTitle'>(),
  userRequest: z.string().min(1).brand<'UserRequest'>(),
  guildId: guildContract.shape.id,
});

export type QuestUserAddBody = z.infer<typeof questUserAddBodyContract>;
