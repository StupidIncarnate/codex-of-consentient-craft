/**
 * PURPOSE: Defines a branded UUID string type
 *
 * USAGE:
 * uuidContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
 * // Returns: Uuid branded string
 */

import { z } from 'zod';

export const uuidContract = z.string().uuid().brand<'Uuid'>();

export type Uuid = z.infer<typeof uuidContract>;
