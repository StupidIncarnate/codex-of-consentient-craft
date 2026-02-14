/**
 * PURPOSE: Defines a branded string type for theme scheme names with length constraints
 *
 * USAGE:
 * themeSchemeNameContract.parse('Ember Depths');
 * // Returns: ThemeSchemeName branded string
 */

import { z } from 'zod';

const MAX_THEME_SCHEME_NAME_LENGTH = 50;

export const themeSchemeNameContract = z
  .string()
  .min(1)
  .max(MAX_THEME_SCHEME_NAME_LENGTH)
  .brand<'ThemeSchemeName'>();

export type ThemeSchemeName = z.infer<typeof themeSchemeNameContract>;
