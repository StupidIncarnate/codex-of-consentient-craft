/**
 * PURPOSE: Defines the validated body shape for endpoints that accept guildId and a message
 *
 * USAGE:
 * const { guildId, message } = guildMessageBodyContract.parse(body);
 * // Returns: { guildId: GuildId, message: UserInput }
 */

import { z } from 'zod';
import { guildIdContract } from '@dungeonmaster/shared/contracts';

export const guildMessageBodyContract = z.object({
  guildId: guildIdContract,
  message: z.string().min(1).brand<'UserMessage'>(),
});

export type GuildMessageBody = z.infer<typeof guildMessageBodyContract>;
