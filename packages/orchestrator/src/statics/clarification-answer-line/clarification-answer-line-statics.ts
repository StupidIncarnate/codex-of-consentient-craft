/**
 * PURPOSE: Holds the separators that join one clarification answer's header, labels and typed text into a
 * single summary line. Reach for this when a line must match the resume prompt and the design-decision title.
 *
 * USAGE:
 * clarificationAnswerLineStatics.separators.text;
 * // Returns ' — ' (space, em dash, space)
 */

export const clarificationAnswerLineStatics = {
  separators: {
    header: ': ',
    labels: ', ',
    text: ' — ',
  },
} as const;
