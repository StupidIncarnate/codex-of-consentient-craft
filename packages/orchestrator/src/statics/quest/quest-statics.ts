/**
 * PURPOSE: Defines immutable quest configuration values
 *
 * USAGE:
 * questStatics.json.indentSpaces;
 * // Returns indent size for quest JSON serialization
 */

export const questStatics = {
  json: {
    indentSpaces: 2,
  },
  designStatuses: {
    allowed: ['explore_design', 'review_design', 'design_approved'],
  },
} as const;
