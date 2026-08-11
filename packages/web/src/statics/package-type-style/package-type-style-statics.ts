/**
 * PURPOSE: The palette token a package chip wears, keyed on the package's KIND. Reach for this
 * rather than writing a colour at a chip's call site, and never key a colour on a package NAME:
 * this app runs against other repos, a repo may hold several UI packages, and every one of them
 * must read as the same kind of thing. Colour therefore reports the tier the work lands in — the
 * chip's own text is what identifies the package — so a card carrying one warm chip and one green
 * one reads as a spanned boundary whatever the two packages happen to be called.
 *
 * USAGE:
 * packageTypeStyleStatics.accent['frontend-react'];
 * // Returns the orange token every e2e-eligible package's chip is drawn in
 */

import { emberDepthsThemeStatics } from '../ember-depths-theme/ember-depths-theme-statics';

const { colors } = emberDepthsThemeStatics;

export const packageTypeStyleStatics = {
  accent: {
    // A person watches these run, so they take the app's "something happens here" orange — the same
    // token PLAY, SEND and the action node card wear. These are also exactly the two e2e-eligible
    // kinds, which is why they share one colour rather than each getting a hue of their own.
    'frontend-react': colors.primary,
    'frontend-ink': colors.primary,
    // Something answers a caller over a wire.
    'http-backend': colors.success,
    'mcp-server': colors.success,
    'programmatic-service': colors.success,
    // Something a developer invokes, directly or through their harness.
    'cli-tool': colors['loot-gold'],
    'hook-handlers': colors['loot-gold'],
    'eslint-plugin': colors['loot-gold'],
    // Nothing runs it; it only ever gets imported. Recessive for the same reason the `state` node
    // accent is: it is the commonest tag on any graph, and a bright one turns a canvas into a
    // wireframe.
    library: colors['text-dim'],
  },
  // A node tagging a package the quest never declared in packagesAffected has no kind to colour by.
  // That is the coverage rule's own failure case and a reason to reject the spec at the review gate,
  // so it is painted in the danger token rather than quietly borrowing a tier's colour.
  unresolved: colors.danger,
} as const;
