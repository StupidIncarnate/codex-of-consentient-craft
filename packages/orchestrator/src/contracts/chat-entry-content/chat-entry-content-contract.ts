/**
 * PURPOSE: Reach for this over promptTextContract when the string is being READ back out of a
 * session line on the way to the browser rather than SENT to a Claude CLI spawn — a rewritten
 * message body may legitimately be empty after normalisation, which promptTextContract's
 * non-empty rule would reject.
 *
 * USAGE:
 * chatEntryContentContract.parse('Here is the plan...');
 * // Returns: ChatEntryContent branded string
 */

import { z } from 'zod';

export const chatEntryContentContract = z.string().brand<'ChatEntryContent'>();

export type ChatEntryContent = z.infer<typeof chatEntryContentContract>;
