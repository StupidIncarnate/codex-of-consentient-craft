/**
 * PURPOSE: Defines the theme scheme structure with name, description, and color token mappings
 *
 * USAGE:
 * themeSchemeContract.parse({name: 'Ember Depths', desc: 'Dark volcanic theme', colors: {'primary': '#ff4500'}});
 * // Returns validated ThemeScheme object
 */

import { z } from '#gateway/npm/zod';

import { hexColorContract } from '@dungeonmaster/shared/contracts';

import { themeColorTokenContract } from '../theme-color-token/theme-color-token-contract';
import { themeSchemeDescriptionContract } from '../theme-scheme-description/theme-scheme-description-contract';
import { themeSchemeNameContract } from '../theme-scheme-name/theme-scheme-name-contract';

export const themeSchemeContract = z.object({
  name: themeSchemeNameContract,
  desc: themeSchemeDescriptionContract,
  // A theme may define only SOME color tokens (see the test's "subset"/"no color tokens" cases),
  // so this is `partialRecord` — v4's plain `z.record` on an enum key is now EXHAUSTIVE and would
  // require every token on every theme.
  colors: z.partialRecord(themeColorTokenContract, hexColorContract),
});

export type ThemeScheme = z.infer<typeof themeSchemeContract>;
