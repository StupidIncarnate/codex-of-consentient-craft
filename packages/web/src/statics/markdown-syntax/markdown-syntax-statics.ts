/**
 * PURPOSE: Fixes the markdown dialect this app renders. The set is deliberately closed — headings,
 * fences, lists, quotes, rules, and five inline marks — because the transcript pane needs agent
 * prose to read well, not to host arbitrary documents. `maxListDepth` clamps indentation so a
 * deeply nested list cannot push its own text off a narrow panel.
 *
 * USAGE:
 * markdownSyntaxStatics.codeFence;
 * // Returns '```'
 */

export const markdownSyntaxStatics = {
  minHeadingLevel: 1,
  maxHeadingLevel: 6,
  codeFence: '```',
  bulletGlyph: '•',
  indentWidth: 2,
  maxListDepth: 3,
} as const;
