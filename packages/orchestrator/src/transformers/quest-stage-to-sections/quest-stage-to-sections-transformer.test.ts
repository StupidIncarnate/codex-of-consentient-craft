import { QuestStageStub } from '../../contracts/quest-stage/quest-stage.stub';
import { questStageToSectionsTransformer } from './quest-stage-to-sections-transformer';

describe('questStageToSectionsTransformer', () => {
  describe('valid stages', () => {
    it('VALID: {stage: "spec"} => returns spec sections', () => {
      const result = questStageToSectionsTransformer({
        stage: QuestStageStub({ value: 'spec' }),
      });

      expect(result).toStrictEqual([
        'flows',
        'designDecisions',
        'contracts',
        'toolingRequirements',
      ]);
    });

    it('VALID: {stage: "spec-flows"} => returns flow-focused sections', () => {
      const result = questStageToSectionsTransformer({
        stage: QuestStageStub({ value: 'spec-flows' }),
      });

      expect(result).toStrictEqual([
        'flows',
        'designDecisions',
        'contracts',
        'toolingRequirements',
      ]);
    });

    it('VALID: {stage: "spec-obs"} => returns observable sections', () => {
      const result = questStageToSectionsTransformer({
        stage: QuestStageStub({ value: 'spec-obs' }),
      });

      expect(result).toStrictEqual([
        'flows',
        'designDecisions',
        'contracts',
        'toolingRequirements',
      ]);
    });

    it('VALID: {stage: "planning"} => returns planningNotes, steps, contracts', () => {
      const result = questStageToSectionsTransformer({
        stage: QuestStageStub({ value: 'planning' }),
      });

      expect(result).toStrictEqual(['planningNotes', 'steps', 'contracts']);
    });

    it('VALID: {stage: "implementation"} => returns planningNotes, steps, contracts, toolingRequirements', () => {
      const result = questStageToSectionsTransformer({
        stage: QuestStageStub({ value: 'implementation' }),
      });

      expect(result).toStrictEqual(['planningNotes', 'steps', 'contracts', 'toolingRequirements']);
    });
  });

  describe('immutability', () => {
    it('VALID: {stage: "spec"} => returns a mutable copy not the original', () => {
      const result1 = questStageToSectionsTransformer({
        stage: QuestStageStub({ value: 'spec' }),
      });
      result1.push('steps' as never);

      const result2 = questStageToSectionsTransformer({
        stage: QuestStageStub({ value: 'spec' }),
      });

      expect(result2).toStrictEqual([
        'flows',
        'designDecisions',
        'contracts',
        'toolingRequirements',
      ]);
    });
  });
});
