/**
 * PURPOSE: Sizes rendered markdown for a transcript column rather than a document. Heading size is
 * a step down FROM body size to a floor, not a scale up from it: an agent message is read inside a
 * narrow panel where a document-scale `h1` would out-shout the role label above it, so `#` gains
 * three points and everything from `####` down simply reads as body with weight doing the work.
 *
 * Because that ladder is deliberately too flat to carry hierarchy on its own, the values that
 * actually make a document scannable are the OTHER three: the gap above a heading, and the rule
 * under the top two levels. Reach for those before reopening the size ladder — a `##` is one point
 * off its neighbours by design, and buying it presence with points is what this file exists to
 * refuse.
 *
 * USAGE:
 * markdownTypographyStatics.bodyFontSize + markdownTypographyStatics.headingStep;
 * // Returns 13 — the size of an h3
 */

export const markdownTypographyStatics = {
  bodyFontSize: 12,
  headingStep: 1,
  headingFlatLevel: 4,
  headingWeight: 700,
  headingGapTop: 12,
  headingRuleMaxLevel: 2,
  headingRulePadding: 3,
  boldWeight: 700,
  blockGap: 4,
  indentPx: 12,
  markerGap: 6,
  codeRadius: 2,
  inlineCodePadding: '0 3px',
  blockCodePadding: '4px 6px',
  quotePadding: 6,
} as const;
