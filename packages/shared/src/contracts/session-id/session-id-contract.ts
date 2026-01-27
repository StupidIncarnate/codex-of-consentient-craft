/**
 * PURPOSE: Defines the branded string type for Claude session identifiers
 *
 * USAGE:
 * sessionIdContract.parse('9c4d8f1c-3e38-48c9-bdec-22b61883b473');
 * // Returns: SessionId branded string
 */

import { z } from 'zod';

export const sessionIdContract = z.string().min(1).brand<'SessionId'>();

export type SessionId = z.infer<typeof sessionIdContract>;
