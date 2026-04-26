/**
 * PURPOSE: Defines the validated body shape for session-clarify responder
 *
 * USAGE:
 * const { guildId, questId, answers, questions } = sessionClarifyBodyContract.parse(body);
 * // Returns: { guildId: GuildId, questId: QuestId, answers: array, questions: array }
 */

import { z } from 'zod';
import { guildIdContract, questIdContract } from '@dungeonmaster/shared/contracts';

export const sessionClarifyBodyContract = z.object({
  guildId: guildIdContract,
  questId: questIdContract,
  answers: z.array(z.unknown()).min(1),
  questions: z.array(z.unknown()),
});

export type SessionClarifyBody = z.infer<typeof sessionClarifyBodyContract>;
