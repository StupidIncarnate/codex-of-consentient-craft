/**
 * PURPOSE: What the chat composer hands to its send, once the live DOM has been walked and
 * serialised. Reach for this over composerSerializedContract when the caller needs the attachment
 * BYTES to actually ship (composerSerializedContract carries only the ids, paired to placeholders
 * by position), and over shared's pastedImageUpload when the caller is still in the browser — that
 * shape is the wire form, after an attachment's dataUrl has already been split apart for the request
 * body.
 *
 * USAGE:
 * composerSendPayloadContract.parse({
 *   message: 'A[Pasted Image 1]B',
 *   attachments: [ComposerAttachmentStub()],
 * });
 * // Returns: ComposerSendPayload
 */

import { z } from 'zod';

import { userInputContract } from '@dungeonmaster/shared/contracts';

import { composerAttachmentContract } from '../composer-attachment/composer-attachment-contract';

export const composerSendPayloadContract = z.object({
  message: userInputContract,
  // In paste order — the server pairs the Nth `[Pasted Image N]` token in `message` with the Nth
  // entry here by position, not by attachmentId.
  attachments: z.array(composerAttachmentContract),
});

export type ComposerSendPayload = z.infer<typeof composerSendPayloadContract>;
