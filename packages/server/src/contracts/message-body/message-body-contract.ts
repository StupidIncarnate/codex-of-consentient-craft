/**
 * PURPOSE: Defines the validated body shape for endpoints that accept only a message
 *
 * USAGE:
 * const { message } = messageBodyContract.parse(body);
 * // Returns: { message: UserMessage }
 */

import { z } from 'zod';

export const messageBodyContract = z.object({
  message: z.string().min(1).brand<'UserMessage'>(),
});

export type MessageBody = z.infer<typeof messageBodyContract>;
