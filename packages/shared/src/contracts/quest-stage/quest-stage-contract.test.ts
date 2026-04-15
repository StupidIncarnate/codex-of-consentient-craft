import { questStageContract } from './quest-stage-contract';
import { QuestStageStub } from './quest-stage.stub';

describe('questStageContract', () => {
  describe('valid stages', () => {
    it('VALID: {value: "spec"} => parses successfully', () => {
      const result = questStageContract.parse(QuestStageStub({ value: 'spec' }));

      expect(result).toBe('spec');
    });

    it('VALID: {value: "spec-flows"} => parses successfully', () => {
      const result = questStageContract.parse(QuestStageStub({ value: 'spec-flows' }));

      expect(result).toBe('spec-flows');
    });

    it('VALID: {value: "planning"} => parses successfully', () => {
      const result = questStageContract.parse(QuestStageStub({ value: 'planning' }));

      expect(result).toBe('planning');
    });

    it('VALID: {default stub} => parses with default value', () => {
      const result = questStageContract.parse(QuestStageStub());

      expect(result).toBe('spec');
    });
  });

  describe('invalid stages', () => {
    it('INVALID: {value: "invalid"} => throws validation error', () => {
      expect(() => {
        return questStageContract.parse('invalid');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
