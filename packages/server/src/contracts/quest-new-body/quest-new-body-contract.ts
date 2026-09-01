/**
 * PURPOSE: The one body contract that carries both a quest's pipeline choice and its opening
 * images, because both arrive before a questId exists to attach them to — every other send route
 * carries at most one of the two, since by then the quest is already running and its pipeline is
 * fixed.
 *
 * USAGE:
 * const { message, questType } = questNewBodyContract.parse(body);
 * // Returns: { message: UserMessage, questType?: QuestType, images?: PastedImageUploadList }
 *
 * WHEN-TO-USE: The `POST /api/guilds/:guildId/quests/new` route only. It is deliberately NOT
 *   messageBodyContract: that shape is shared with the chat endpoints, which post into an
 *   EXISTING quest whose type is already settled, so accepting questType there would let a caller
 *   appear to change a running quest's pipeline.
 */

import { z } from 'zod';

import { questTypeContract } from '@dungeonmaster/shared/contracts';

import { pastedImageUploadListContract } from '../pasted-image-upload-list/pasted-image-upload-list-contract';
import { userMessageContract } from '../user-message/user-message-contract';

export const questNewBodyContract = z.object({
  message: userMessageContract,
  questType: questTypeContract
    .optional()
    .describe(
      "Which pipeline the new quest follows. Omit for the default feature pipeline; 'bug-hunt' seeds the BugHunt intake instead of ChaosWhisperer's — the only way a bug-hunt differs from a feature quest, since both run the identical implementation relay afterward.",
    ),
  images: pastedImageUploadListContract
    .optional()
    .describe(
      'Images pasted into the create surface, where no questId exists yet — the first message of a quest is the one most likely to carry screenshots, which is why the create route needs the field at all.',
    ),
});

export type QuestNewBody = z.infer<typeof questNewBodyContract>;
