/**
 * PURPOSE: Defines the RulePrefixGroup structure for grouping ESLint rule names
 * by their dash-prefix in the eslint-plugin project-map headline renderer
 *
 * USAGE:
 * rulePrefixGroupContract.parse({
 *   prefix: 'ban',
 *   names: ['ban-primitives', 'ban-silent-catch'],
 * });
 * // Returns validated RulePrefixGroup
 *
 * WHEN-TO-USE: ruleNamesGroupByPrefixTransformer return type and eslint-plugin headline rendering
 */

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';

export const rulePrefixGroupContract = z.object({
  prefix: contentTextContract,
  names: z.array(contentTextContract),
});

export type RulePrefixGroup = z.infer<typeof rulePrefixGroupContract>;
