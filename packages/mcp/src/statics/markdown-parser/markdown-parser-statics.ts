/**
 * PURPOSE: Defines constants for parsing markdown headers
 *
 * USAGE:
 * const prefix = markdownParserStatics.headerPrefix.level2; // '## '
 * // Returns markdown header parsing constants
 */
export const markdownParserStatics = {
  headerPrefix: {
    level2: '## ',
    length: 3,
  },
} as const;
