/**
 * PURPOSE: Defines the validated body shape for the new-quest-from-chat endpoint — the first
 * message, plus which pipeline the quest should follow.
 *
 * USAGE:
 * const { message, questType } = questNewBodyContract.parse(body);
 * // Returns: { message: UserMessage, questType?: QuestType }
 *
 * WHEN-TO-USE: The `POST /api/guilds/:guildId/quests/new` route only. It is deliberately NOT
 *   messageBodyContract: that shape is shared with the chat endpoints, which post into an
 *   EXISTING quest whose type is already settled, so accepting questType there would let a caller
 *   appear to change a running quest's pipeline.
 */

import { z } from 'zod';

import { questTypeContract } from '@dungeonmaster/shared/contracts';

export const questNewBodyContract = z.object({
  message: z.string().min(1).brand<'UserMessage'>(),
  questType: questTypeContract
    .optional()
    .describe(
      "Which pipeline the new quest follows. Omit for the default feature pipeline; 'bug-hunt' seeds the BugHunt intake instead of ChaosWhisperer's — the only way a bug-hunt differs from a feature quest, since both run the identical implementation relay afterward.",
    ),
});

export type QuestNewBody = z.infer<typeof questNewBodyContract>;
