/**
 * PURPOSE: Defines the branded UUID type for DesignDecision identifiers
 *
 * USAGE:
 * designDecisionIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
 * // Returns: DesignDecisionId branded string
 */

import { z } from 'zod';

export const designDecisionIdContract = z.string().uuid().brand<'DesignDecisionId'>();

export type DesignDecisionId = z.infer<typeof designDecisionIdContract>;
