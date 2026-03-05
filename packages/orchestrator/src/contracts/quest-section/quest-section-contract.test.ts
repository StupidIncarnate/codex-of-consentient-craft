import { questSectionContract } from './quest-section-contract';
import { QuestSectionStub } from './quest-section.stub';

describe('questSectionContract', () => {
  describe('valid sections', () => {
    it('VALID: {value: "designDecisions"} => parses successfully', () => {
      const result = questSectionContract.parse(QuestSectionStub({ value: 'designDecisions' }));

      expect(result).toBe('designDecisions');
    });

    it('VALID: {value: "contracts"} => parses successfully', () => {
      const result = questSectionContract.parse(QuestSectionStub({ value: 'contracts' }));

      expect(result).toBe('contracts');
    });

    it('VALID: {value: "steps"} => parses successfully', () => {
      const result = questSectionContract.parse(QuestSectionStub({ value: 'steps' }));

      expect(result).toBe('steps');
    });

    it('VALID: {value: "toolingRequirements"} => parses successfully', () => {
      const result = questSectionContract.parse(QuestSectionStub({ value: 'toolingRequirements' }));

      expect(result).toBe('toolingRequirements');
    });

    it('VALID: {value: "executionLog"} => parses successfully', () => {
      const result = questSectionContract.parse(QuestSectionStub({ value: 'executionLog' }));

      expect(result).toBe('executionLog');
    });

    it('VALID: {value: "flows"} => parses successfully', () => {
      const result = questSectionContract.parse(QuestSectionStub({ value: 'flows' }));

      expect(result).toBe('flows');
    });

    it('VALID: {default stub} => parses with default value', () => {
      const result = questSectionContract.parse(QuestSectionStub());

      expect(result).toBe('designDecisions');
    });
  });

  describe('invalid sections', () => {
    it('INVALID_SECTION: {value: "invalid"} => throws validation error', () => {
      expect(() => {
        return questSectionContract.parse('invalid');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_SECTION: {value: ""} => throws validation error', () => {
      expect(() => {
        return questSectionContract.parse('');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_SECTION: {value: "requirements"} => throws validation error (removed section)', () => {
      expect(() => {
        return questSectionContract.parse('requirements');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_SECTION: {value: "contexts"} => throws validation error (removed section)', () => {
      expect(() => {
        return questSectionContract.parse('contexts');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_SECTION: {value: "observables"} => throws validation error (removed section)', () => {
      expect(() => {
        return questSectionContract.parse('observables');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
