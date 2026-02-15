/**
 * PURPOSE: Validates URL-safe kebab-case strings for use in URLs
 *
 * USAGE:
 * urlSlugContract.parse('my-guild-name');
 * // Returns: UrlSlug branded string
 */

import { z } from 'zod';

export const urlSlugContract = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u)
  .brand<'UrlSlug'>();

export type UrlSlug = z.infer<typeof urlSlugContract>;
