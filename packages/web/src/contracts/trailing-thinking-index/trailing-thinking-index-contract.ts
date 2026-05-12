/**
 * PURPOSE: Defines a branded integer index marking the trailing empty-thinking position in a chat-group list, or -1 when none
 *
 * USAGE:
 * trailingThinkingIndexContract.parse(-1);
 * // Returns: TrailingThinkingIndex (-1 sentinel = no trailing empty-thinking)
 * trailingThinkingIndexContract.parse(4);
 * // Returns: TrailingThinkingIndex pointing at groups[4] which is the empty-thinking entry to swap for a streaming indicator.
 */

import { z } from 'zod';

export const trailingThinkingIndexContract = z
  .number()
  .int()
  .min(-1)
  .brand<'TrailingThinkingIndex'>();

export type TrailingThinkingIndex = z.infer<typeof trailingThinkingIndexContract>;
