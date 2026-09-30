/**
 * PURPOSE: Defines the session object whose `id` every contract and function that holds one reuses
 *
 * USAGE:
 * sessionContract.parse({ id: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });
 * // Returns: Session object
 */

import { z } from '#gateway/npm/zod';

export const sessionContract = z
  .object({
    id: z.string().min(1).brand<'SessionId'>(),
  })
  .brand<'Session'>();

export type Session = z.infer<typeof sessionContract>;
