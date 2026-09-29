import { questStageToSectionsTransformer } from './quest-stage-to-sections-transformer';

const SPEC_SECTIONS = [
  'flows',
  'designDecisions',
  'contracts',
  'toolingRequirements',
  'packagesAffected',
  'operations',
  'workItems',
];

describe('questStageToSectionsTransformer', () => {
  describe('valid stages', () => {
    it('VALID: {stage: "spec"} => returns every section except planningNotes', () => {
      const result = questStageToSectionsTransformer({
        stage: 'spec',
      });

      expect(result).toStrictEqual(SPEC_SECTIONS);
    });

    it('VALID: {stage: "planning"} => returns planningNotes, operations, contracts and packagesAffected', () => {
      const result = questStageToSectionsTransformer({
        stage: 'planning',
      });

      expect(result).toStrictEqual([
        'planningNotes',
        'operations',
        'contracts',
        'packagesAffected',
      ]);
    });

    it('VALID: {stage: "implementation"} => returns every section, so plan-vs-reality is diagnosable', () => {
      const result = questStageToSectionsTransformer({
        stage: 'implementation',
      });

      expect(result).toStrictEqual([
        'flows',
        'designDecisions',
        'contracts',
        'toolingRequirements',
        'packagesAffected',
        'operations',
        'workItems',
        'planningNotes',
      ]);
    });
  });

  describe('immutability', () => {
    it('VALID: {stage: "spec"} => returns a mutable copy not the original', () => {
      const result1 = questStageToSectionsTransformer({
        stage: 'spec',
      });
      result1.push('planningNotes' as never);

      const result2 = questStageToSectionsTransformer({
        stage: 'spec',
      });

      expect(result2).toStrictEqual(SPEC_SECTIONS);
    });
  });
});
