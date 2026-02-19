import { QuestStageStub } from '../../contracts/quest-stage/quest-stage.stub';
import { questStageToSectionsTransformer } from './quest-stage-to-sections-transformer';

describe('questStageToSectionsTransformer', () => {
  describe('valid stages', () => {
    it('VALID: {stage: "spec"} => returns all spec sections', () => {
      const result = questStageToSectionsTransformer({
        stage: QuestStageStub({ value: 'spec' }),
      });

      expect(result).toStrictEqual([
        'requirements',
        'designDecisions',
        'contracts',
        'contexts',
        'observables',
        'toolingRequirements',
        'flows',
      ]);
    });

    it('VALID: {stage: "spec-decisions"} => returns foundation sections', () => {
      const result = questStageToSectionsTransformer({
        stage: QuestStageStub({ value: 'spec-decisions' }),
      });

      expect(result).toStrictEqual([
        'requirements',
        'designDecisions',
        'contracts',
        'toolingRequirements',
      ]);
    });

    it('VALID: {stage: "spec-bdd"} => returns behavior sections', () => {
      const result = questStageToSectionsTransformer({
        stage: QuestStageStub({ value: 'spec-bdd' }),
      });

      expect(result).toStrictEqual(['contexts', 'observables', 'contracts']);
    });

    it('VALID: {stage: "spec-flows"} => returns flows sections', () => {
      const result = questStageToSectionsTransformer({
        stage: QuestStageStub({ value: 'spec-flows' }),
      });

      expect(result).toStrictEqual(['requirements', 'designDecisions', 'flows', 'contracts']);
    });

    it('VALID: {stage: "implementation"} => returns steps and contracts', () => {
      const result = questStageToSectionsTransformer({
        stage: QuestStageStub({ value: 'implementation' }),
      });

      expect(result).toStrictEqual(['steps', 'contracts']);
    });
  });

  describe('immutability', () => {
    it('VALID: {stage: "spec"} => returns a mutable copy not the original', () => {
      const result1 = questStageToSectionsTransformer({
        stage: QuestStageStub({ value: 'spec' }),
      });
      const result2 = questStageToSectionsTransformer({
        stage: QuestStageStub({ value: 'spec' }),
      });

      expect(result1).not.toBe(result2);
      expect(result1).toStrictEqual(result2);
    });
  });
});
