/**
 * PURPOSE: Defines a branded enum type for theme color token identifiers
 *
 * USAGE:
 * themeColorTokenContract.parse('primary');
 * // Returns: ThemeColorToken branded string
 */

import { z } from 'zod';

export const themeColorTokenContract = z
  .enum([
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
  ])
  .brand<'ThemeColorToken'>();

export type ThemeColorToken = z.infer<typeof themeColorTokenContract>;
