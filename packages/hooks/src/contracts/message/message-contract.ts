/**
 * PURPOSE: Validates a generic message string
 *
 * USAGE:
 * const message = messageContract.parse("This is a message");
 * // Returns branded Message string
 */
import { z } from '#gateway/npm/zod';

export const messageContract = z.string().brand<'Message'>();

export type Message = z.infer<typeof messageContract>;
