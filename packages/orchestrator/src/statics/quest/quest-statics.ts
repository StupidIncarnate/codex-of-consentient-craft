/**
 * PURPOSE: Defines immutable quest configuration values
 *
 * USAGE:
 * questStatics.phases.order;
 * // Returns array of phase types in execution order
 */

export const questStatics = {
  phases: {
    order: ['discovery', 'implementation', 'testing', 'review'] as const,
  },
  json: {
    indentSpaces: 2,
  },
  designStatuses: {
    allowed: ['explore_design', 'review_design', 'design_approved'],
  },
} as const;
