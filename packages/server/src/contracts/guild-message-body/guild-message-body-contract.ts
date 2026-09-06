/**
 * PURPOSE: The chat and follow-up bodies resolve guildId server-side from questId via the quest
 * path adapter; the design route's caller already holds guildId from its own guild-scoped URL, so
 * this is the one send-message body contract that still takes it as given in the request instead.
 *
 * USAGE:
 * const { guildId, message, images } = guildMessageBodyContract.parse(body);
 * // Returns: { guildId: GuildId, message: UserMessage, images?: PastedImageUploadList }
 */

import { z } from 'zod';
import { guildIdContract } from '@dungeonmaster/shared/contracts';

import { userMessageContract } from '../user-message/user-message-contract';
import { pastedImageUploadListContract } from '../pasted-image-upload-list/pasted-image-upload-list-contract';

export const guildMessageBodyContract = z.object({
  guildId: guildIdContract,
  message: userMessageContract,
  images: pastedImageUploadListContract
    .optional()
    .describe(
      'The same ordered image array the chat and follow-up send routes carry, so the server rewrites [Pasted Image N] placeholders the same way regardless of which of the three routes the message came in on.',
    ),
});

export type GuildMessageBody = z.infer<typeof guildMessageBodyContract>;
