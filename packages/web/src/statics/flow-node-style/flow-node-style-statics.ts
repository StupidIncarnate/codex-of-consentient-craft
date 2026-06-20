/**
 * PURPOSE: Defines immutable style tokens for flow node types — accent colors and selection ring
 *
 * USAGE:
 * flowNodeStyleStatics.accent.decision;
 * // Returns '#f5a623'
 */

import { emberDepthsThemeStatics } from '../ember-depths-theme/ember-depths-theme-statics';

export const flowNodeStyleStatics = {
  accent: {
    decision: '#f5a623',
    action: '#4aa3df',
    state: '#8b9bb4',
    terminal: '#5bbf8a',
  },
  selectionRing: emberDepthsThemeStatics.colors.primary,
} as const;
