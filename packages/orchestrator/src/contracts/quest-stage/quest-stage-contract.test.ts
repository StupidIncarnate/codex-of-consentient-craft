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

    it('VALID: {value: "spec-obs"} => parses successfully', () => {
      const result = questStageContract.parse(QuestStageStub({ value: 'spec-obs' }));

      expect(result).toBe('spec-obs');
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
    it('INVALID: {value: "invalid"} => throws validation error', () => {
      expect(() => {
        return questStageContract.parse('invalid');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return questStageContract.parse('');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: "spec-decisions"} => throws validation error (removed stage)', () => {
      expect(() => {
        return questStageContract.parse('spec-decisions');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: "spec-bdd"} => throws validation error (removed stage)', () => {
      expect(() => {
        return questStageContract.parse('spec-bdd');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
