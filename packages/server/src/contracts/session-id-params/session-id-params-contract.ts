/**
 * PURPOSE: Defines the validated shape for HTTP route params containing a sessionId field
 *
 * USAGE:
 * const { sessionId } = sessionIdParamsContract.parse(params);
 * // Returns: SessionIdParams with branded SessionId
 */

import { z } from '#gateway/npm/zod';
import { sessionContract } from '@dungeonmaster/shared/contracts';

export const sessionIdParamsContract = z.object({
  sessionId: sessionContract.shape.id,
});

export type SessionIdParams = z.infer<typeof sessionIdParamsContract>;
