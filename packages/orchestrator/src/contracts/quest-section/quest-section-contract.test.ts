import { questSectionContract } from './quest-section-contract';
import { QuestSectionStub } from './quest-section.stub';

describe('questSectionContract', () => {
  describe('valid sections', () => {
    it('VALID: {value: "requirements"} => parses successfully', () => {
      const result = questSectionContract.parse(QuestSectionStub({ value: 'requirements' }));

      expect(result).toBe('requirements');
    });

    it('VALID: {value: "designDecisions"} => parses successfully', () => {
      const result = questSectionContract.parse(QuestSectionStub({ value: 'designDecisions' }));

      expect(result).toBe('designDecisions');
    });

    it('VALID: {value: "contracts"} => parses successfully', () => {
      const result = questSectionContract.parse(QuestSectionStub({ value: 'contracts' }));

      expect(result).toBe('contracts');
    });

    it('VALID: {value: "contexts"} => parses successfully', () => {
      const result = questSectionContract.parse(QuestSectionStub({ value: 'contexts' }));

      expect(result).toBe('contexts');
    });

    it('VALID: {value: "observables"} => parses successfully', () => {
      const result = questSectionContract.parse(QuestSectionStub({ value: 'observables' }));

      expect(result).toBe('observables');
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

    it('VALID: {default stub} => parses with default value', () => {
      const result = questSectionContract.parse(QuestSectionStub());

      expect(result).toBe('requirements');
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
  });
});
