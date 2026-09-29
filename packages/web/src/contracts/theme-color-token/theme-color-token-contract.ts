/**
 * PURPOSE: Defines a branded enum type for theme color token identifiers
 *
 * USAGE:
 * themeColorTokenContract.parse('primary');
 * // Returns: ThemeColorToken branded string
 */

import { z } from '#gateway/npm/zod';

export const themeColorTokenContract = z.enum([
  'bg-deep',
  'bg-surface',
  'bg-raised',
  'border',
  'text',
  'text-dim',
  'primary',
  'success',
  'warning',
  'danger',
  'loot-gold',
  'loot-rare',
]);

export type ThemeColorToken = z.infer<typeof themeColorTokenContract>;
