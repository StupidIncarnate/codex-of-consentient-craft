import { questStageMappingStatics } from './quest-stage-mapping-statics';

describe('questStageMappingStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(questStageMappingStatics).toStrictEqual({
      stages: {
        spec: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        'spec-flows': ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        'spec-obs': ['flows', 'contracts', 'toolingRequirements'],
        implementation: ['steps', 'contracts', 'toolingRequirements'],
      },
    });
  });
});
