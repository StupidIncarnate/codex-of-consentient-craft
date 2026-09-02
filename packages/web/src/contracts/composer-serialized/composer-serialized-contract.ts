/**
 * PURPOSE: The ordinal lives in the text and the id lives in a parallel array, rather than the
 * text naming ids directly, because the text is what the user reads back and what the localStorage
 * draft holds verbatim — it has to stay legible on its own, and pairing an ordinal to an id is a
 * matter of position, not a name embedded in the string.
 *
 * USAGE:
 * composerSerializedContract.parse({ text: 'A[Pasted Image 1]B', attachmentIds: ['f47ac10b-58cc-4372-a567-0e02b2c3d479'] });
 * // Returns: ComposerSerialized — what the chat composer's content collapses to for a draft save or a send
 */

import { z } from 'zod';

import { userInputContract } from '@dungeonmaster/shared/contracts';

import { attachmentIdContract } from '../attachment-id/attachment-id-contract';

export const composerSerializedContract = z.object({
  // Carries a `[Pasted Image N]` placeholder at each image's position, N being a one-based ordinal
  // counted left to right across THIS message. Two byte-identical pastes therefore still get
  // distinct ordinals, because the ordinal is a position and not a content hash.
  text: userInputContract,
  // In the same left-to-right order as the placeholders, so index i of this array is the
  // attachment the placeholder N = i + 1 stands for.
  attachmentIds: z.array(attachmentIdContract),
});

export type ComposerSerialized = z.infer<typeof composerSerializedContract>;
