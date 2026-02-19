/**
 * PURPOSE: Defines the branded UUID type for Flow identifiers
 *
 * USAGE:
 * flowIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
 * // Returns: FlowId branded string
 */

import { z } from 'zod';

export const flowIdContract = z.string().uuid().brand<'FlowId'>();

export type FlowId = z.infer<typeof flowIdContract>;
