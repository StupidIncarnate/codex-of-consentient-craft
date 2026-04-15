/**
 * PURPOSE: Maps quest pipeline stages to the sections each stage includes
 *
 * USAGE:
 * questStageMappingStatics.stages.spec;
 * // Returns ['flows', 'designDecisions', 'contracts', 'toolingRequirements']
 */

export const questStageMappingStatics = {
  stages: {
    spec: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
    'spec-flows': ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
    'spec-obs': ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
    planning: ['planningNotes', 'steps', 'contracts'],
    implementation: ['planningNotes', 'steps', 'contracts', 'toolingRequirements'],
  },
} as const;
