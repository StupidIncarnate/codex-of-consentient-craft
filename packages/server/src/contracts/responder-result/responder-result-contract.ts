/**
 * PURPOSE: Defines the standard response shape for all server responders
 *
 * USAGE:
 * const result: ResponderResult = { status: httpStatusStatics.success.ok, data: guilds };
 * // Returns typed responder result with status and data
 */

import { z } from 'zod';

export const responderResultContract = z.object({
  status: z.number().int().brand<'HttpStatusCode'>(),
  data: z.unknown(),
});

export type ResponderResult = z.infer<typeof responderResultContract>;
