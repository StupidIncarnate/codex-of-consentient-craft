/**
 * PURPOSE: Defines the branded UUID type for Context identifiers
 *
 * USAGE:
 * contextIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
 * // Returns: ContextId branded string
 */

import { z } from 'zod';

export const contextIdContract = z.string().uuid().brand<'ContextId'>();

export type ContextId = z.infer<typeof contextIdContract>;
