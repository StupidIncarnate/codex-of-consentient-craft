/**
 * PURPOSE: Defines the branded UUID type for Requirement identifiers
 *
 * USAGE:
 * requirementIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
 * // Returns: RequirementId branded string
 */

import { z } from 'zod';

export const requirementIdContract = z.string().uuid().brand<'RequirementId'>();

export type RequirementId = z.infer<typeof requirementIdContract>;
