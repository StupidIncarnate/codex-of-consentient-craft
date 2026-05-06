/**
 * PURPOSE: Maps a usedPercentage to a theme color — danger (>=80), warning (>=50), default (<50)
 *
 * USAGE:
 * rateLimitColorTransformer({ usedPercentage: 81 });
 * // Returns: '#ef4444' (danger)
 *
 * Logic mirrors statusline-command.sh:80-86 (`color_for_pct` bash function).
 */

import { hexColorContract, type HexColor } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const DANGER_THRESHOLD = 80;
const WARNING_THRESHOLD = 50;

export const rateLimitColorTransformer = ({
  usedPercentage,
}: {
  usedPercentage: number;
}): HexColor => {
  if (usedPercentage >= DANGER_THRESHOLD) {
    return hexColorContract.parse(emberDepthsThemeStatics.colors.danger);
  }
  if (usedPercentage >= WARNING_THRESHOLD) {
    return hexColorContract.parse(emberDepthsThemeStatics.colors.warning);
  }
  return hexColorContract.parse(emberDepthsThemeStatics.colors['text-dim']);
};
