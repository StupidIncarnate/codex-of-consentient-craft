import { questStageMappingStatics } from './quest-stage-mapping-statics';

describe('questStageMappingStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(questStageMappingStatics).toStrictEqual({
      stages: {
        spec: [
          'flows',
          'designDecisions',
          'contracts',
          'toolingRequirements',
          'operations',
          'workItems',
        ],
        planning: ['planningNotes', 'operations', 'contracts'],
        implementation: [
          'flows',
          'designDecisions',
          'contracts',
          'toolingRequirements',
          'operations',
          'workItems',
          'planningNotes',
        ],
      },
    });
  });

  it('VALID: spec => is every section except planningNotes, so one read reconciles ledger against flows', () => {
    const specSections = [...questStageMappingStatics.stages.spec].sort();

    expect(specSections).toStrictEqual([
      'contracts',
      'designDecisions',
      'flows',
      'operations',
      'toolingRequirements',
      'workItems',
    ]);
  });

  it('VALID: implementation => withholds nothing, so a plan is never served without the target it aims at', () => {
    const implementationSections = [...questStageMappingStatics.stages.implementation].sort();

    expect(implementationSections).toStrictEqual([
      'contracts',
      'designDecisions',
      'flows',
      'operations',
      'planningNotes',
      'toolingRequirements',
      'workItems',
    ]);
  });
});
