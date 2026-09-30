/**
 * PURPOSE: Defines the `data` SessionListResponder returns on success
 *
 * USAGE:
 * const data = sessionListResponseDataContract.parse(value);
 * // Returns validated SessionListResponseData
 */

import { z } from '#gateway/npm/zod';
import { sessionListItemContract } from '@dungeonmaster/shared/contracts';

export const sessionListResponseDataContract = z.array(sessionListItemContract);

export type SessionListResponseData = z.infer<typeof sessionListResponseDataContract>;
