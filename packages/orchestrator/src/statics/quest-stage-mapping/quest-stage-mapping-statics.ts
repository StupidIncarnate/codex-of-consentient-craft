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
    'spec-obs': ['flows', 'contracts', 'toolingRequirements'],
    implementation: ['steps', 'contracts', 'toolingRequirements'],
  },
} as const;
