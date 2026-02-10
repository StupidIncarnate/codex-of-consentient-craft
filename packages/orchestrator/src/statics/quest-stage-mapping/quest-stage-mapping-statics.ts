/**
 * PURPOSE: Maps quest pipeline stages to the sections each stage includes
 *
 * USAGE:
 * questStageMappingStatics.stages.spec;
 * // Returns ['requirements', 'designDecisions', 'contracts', 'contexts', 'observables', 'toolingRequirements']
 */

export const questStageMappingStatics = {
  stages: {
    spec: [
      'requirements',
      'designDecisions',
      'contracts',
      'contexts',
      'observables',
      'toolingRequirements',
    ],
    'spec-decisions': ['requirements', 'designDecisions', 'contracts', 'toolingRequirements'],
    'spec-bdd': ['contexts', 'observables', 'contracts'],
    implementation: ['steps', 'contracts'],
  },
} as const;
