/**
 * PURPOSE: One home for the branded string the chat, follow-up, design, and create-quest
 * request bodies all carry, and the type the server's image-token rewrite returns. Reach for
 * this over the orchestrator's promptTextContract, which is the CLI-bound prompt text AFTER
 * the read-the-images trailer has been appended — a later string in the same pipeline, not
 * this one.
 *
 * USAGE:
 * const message: UserMessage = userMessageContract.parse('fix the login bug');
 * // Returns a branded UserMessage string type
 */
import { z } from 'zod';

export const userMessageContract = z.string().min(1).brand<'UserMessage'>();

export type UserMessage = z.infer<typeof userMessageContract>;
