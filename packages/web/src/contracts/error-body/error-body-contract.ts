/**
 * PURPOSE: Defines the JSON error-body shape a server returns on a non-ok HTTP response ({ error: string }), so fetch adapters can surface the server's message verbatim
 *
 * USAGE:
 * const parsed = errorBodyContract.safeParse(await response.json());
 * // parsed.success === true exposes parsed.data.error — the server's error message
 */

import { z } from '#gateway/npm/zod';

export const errorBodyContract = z
  .object({
    error: z.string().min(1).brand<'ErrorBodyError'>(),
  })
  .brand<'ErrorBody'>();

export type ErrorBody = z.infer<typeof errorBodyContract>;
