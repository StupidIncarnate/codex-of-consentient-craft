import { questStageContract } from './quest-stage-contract';
import { QuestStageStub } from './quest-stage.stub';

describe('questStageContract', () => {
  describe('valid stages', () => {
    it('VALID: {value: "spec"} => parses successfully', () => {
      const result = questStageContract.parse(QuestStageStub({ value: 'spec' }));

      expect(result).toBe('spec');
    });

    it('VALID: {value: "spec-decisions"} => parses successfully', () => {
      const result = questStageContract.parse(QuestStageStub({ value: 'spec-decisions' }));

      expect(result).toBe('spec-decisions');
    });

    it('VALID: {value: "spec-bdd"} => parses successfully', () => {
      const result = questStageContract.parse(QuestStageStub({ value: 'spec-bdd' }));

      expect(result).toBe('spec-bdd');
    });

    it('VALID: {value: "implementation"} => parses successfully', () => {
      const result = questStageContract.parse(QuestStageStub({ value: 'implementation' }));

      expect(result).toBe('implementation');
    });

    it('VALID: {default stub} => parses with default value', () => {
      const result = questStageContract.parse(QuestStageStub());

      expect(result).toBe('spec');
    });
  });

  describe('invalid stages', () => {
    it('INVALID_STAGE: {value: "invalid"} => throws validation error', () => {
      expect(() => {
        return questStageContract.parse('invalid');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_STAGE: {value: ""} => throws validation error', () => {
      expect(() => {
        return questStageContract.parse('');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
