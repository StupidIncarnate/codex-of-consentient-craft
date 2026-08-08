/**
 * PURPOSE: The diagram's slice of the Ember Depths palette — which token each flow node type wears,
 * and what the connector lines between them are drawn in. Every value resolves through
 * emberDepthsThemeStatics rather than carrying a hex of its own, because a canvas that mixes its
 * own palette into the app's reads as a foreign wireframe pasted into the panel.
 *
 * USAGE:
 * flowNodeStyleStatics.accent.decision;
 * // Returns the gold token a decision card's border, icon and contract badge share
 */

import { emberDepthsThemeStatics } from '../ember-depths-theme/ember-depths-theme-statics';

const { colors } = emberDepthsThemeStatics;

export const flowNodeStyleStatics = {
  accent: {
    // Orange is the app's "something happens here" colour — PLAY, SEND, the streaming indicator —
    // and an action is the only node type that does something.
    action: colors.primary,
    // Gold marks a fork worth stopping at; the branch labels beside it carry the conditions.
    decision: colors['loot-gold'],
    // The run ended. The one cool accent on the canvas, and it earns the exception: a terminal is
    // the node a reader should be able to find without reading any label.
    terminal: colors.success,
    // The DEFAULT type and by far the commonest, so it recedes into a warm dim brown and lets the
    // label carry the card. Giving this one a bright accent is what made a canvas of mostly-state
    // nodes read as a white wireframe — the fix is not a warmer bright, it is not being bright.
    state: colors['text-dim'],
  },
  selectionRing: colors.primary,
  // Connectors are structure, not content: visible enough to trace a path, quiet enough that a
  // dense graph does not read as a ball of string. React Flow's own default is a cool #b1b1b7 that
  // out-shouts every card it joins.
  edgeStroke: colors['text-dim'],
} as const;
