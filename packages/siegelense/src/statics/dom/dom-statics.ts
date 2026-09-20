/**
 * PURPOSE: Every knob the `dom` step reads itself by — match cap, text limit, allowed fields, text
 * modes, and the capped warning note. Reach for this over inline numbers: `dom` is Rung 4 of the
 * reading ladder (the escape hatch), and its three guards (own text default, fields projection, and
 * self-reporting cap) are defined here so contracts, adapters, and transformers share one source of truth.
 *
 * USAGE:
 * domStatics.limits.maxMatches;
 * // Returns 10 — the match cap that prevents unbounded payload blowup
 *
 * domStatics.textModes.default;
 * // Returns 'own' — own text nodes by default, avoiding recursive textContent blowup
 */

export const domStatics = {
  limits: {
    // A match cap that SAYS it capped, with the true count beside it (siegelense-tooling.md line 655).
    // count: 58, showing 10 is an answer; ten silent rows is a trap.
    maxMatches: 10,
    // Text length limit for single node text attribute to avoid massive text blocks.
    textChars: 4000,
  },
  fields: {
    all: [
      'count',
      'showing',
      'capped',
      'tagName',
      'testId',
      'className',
      'childCount',
      'display',
      'visibility',
      'opacity',
      'rect',
      'text',
      'attrs',
      'value',
    ] as const,
    defaultNodeFields: [
      'tagName',
      'testId',
      'className',
      'childCount',
      'display',
      'visibility',
      'opacity',
      'rect',
      'text',
      'attrs',
      'value',
    ] as const,
  },
  textModes: {
    all: ['own', 'full'] as const,
    default: 'own' as const,
  },
} as const;
