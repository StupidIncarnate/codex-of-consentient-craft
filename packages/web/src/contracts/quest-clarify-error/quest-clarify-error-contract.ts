/**
 * PURPOSE: Validates the `{ error }` body the clarify responder answers a non-2xx with, so
 * questClarifyBroker can throw the server's own refusal text. Reach for this over
 * questClarifyResultContract when the response is a refusal rather than a success.
 *
 * USAGE:
 * questClarifyErrorContract.safeParse({ error: 'An answer carries more than 5 images' });
 * // Returns success with the error text; a body with no `error` parses with it absent
 */

import { z } from '#gateway/npm/zod';

export const questClarifyErrorContract = z
  .object({
    error: z.string().min(1).brand<'QuestClarifyErrorError'>().optional(),
  })
  .brand<'QuestClarifyError'>();

export type QuestClarifyError = z.infer<typeof questClarifyErrorContract>;
