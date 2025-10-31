/**
 * PURPOSE: Validates strings are in kebab-case format (lowercase with hyphens)
 *
 * USAGE:
 * const kebabStr = kebabCaseStringContract.parse('user-profile-broker');
 * // Returns branded KebabCaseString; throws on 'UserProfile' or 'user_profile'
 */
import { z } from 'zod';

export const kebabCaseStringContract = z
  .string()
  .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u, 'Must be kebab-case')
  .brand<'KebabCaseString'>();

export type KebabCaseString = z.infer<typeof kebabCaseStringContract>;
