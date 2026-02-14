/**
 * PURPOSE: Defines a branded string type for theme scheme descriptions with length constraints
 *
 * USAGE:
 * themeSchemeDescriptionContract.parse('A dark volcanic theme with ember accents');
 * // Returns: ThemeSchemeDescription branded string
 */

import { z } from 'zod';

const MAX_THEME_SCHEME_DESCRIPTION_LENGTH = 200;

export const themeSchemeDescriptionContract = z
  .string()
  .min(1)
  .max(MAX_THEME_SCHEME_DESCRIPTION_LENGTH)
  .brand<'ThemeSchemeDescription'>();

export type ThemeSchemeDescription = z.infer<typeof themeSchemeDescriptionContract>;
