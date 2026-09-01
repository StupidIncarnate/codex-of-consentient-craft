/**
 * PURPOSE: The body chat endpoints share when replying into an existing quest, whose pipeline
 * is already settled — reach for questNewBodyContract instead where a caller is starting a new
 * quest and still gets to pick one.
 *
 * USAGE:
 * const { message, images } = messageBodyContract.parse(body);
 * // Returns: { message: UserMessage, images?: PastedImageUploadList }
 */

import { z } from 'zod';

import { pastedImageUploadListContract } from '../pasted-image-upload-list/pasted-image-upload-list-contract';
import { userMessageContract } from '../user-message/user-message-contract';

export const messageBodyContract = z.object({
  message: userMessageContract,
  images: pastedImageUploadListContract
    .optional()
    .describe(
      'The pasted images in paste order, at most maxImagesPerMessage of them. The Nth entry ' +
        'is the one the Nth [Pasted Image N] placeholder in message refers to. Absent on a ' +
        'text-only send.',
    ),
});

export type MessageBody = z.infer<typeof messageBodyContract>;
