import { questSelectionIndexContract } from './quest-selection-index-contract';
import { QuestSelectionIndexStub } from './quest-selection-index.stub';

describe('questSelectionIndexContract', () => {
  describe('valid indices', () => {
    it('VALID: {value: 0} => parses successfully', () => {
      const index = QuestSelectionIndexStub({ value: 0 });

      const result = questSelectionIndexContract.parse(index);

      expect(result).toBe(0);
    });

    it('VALID: {value: 5} => parses successfully', () => {
      const index = QuestSelectionIndexStub({ value: 5 });

      const result = questSelectionIndexContract.parse(index);

      expect(result).toBe(5);
    });

    it('VALID: {default stub} => parses to 0', () => {
      const index = QuestSelectionIndexStub();

      const result = questSelectionIndexContract.parse(index);

      expect(result).toBe(0);
    });
  });

  describe('invalid indices', () => {
    it('INVALID_NEGATIVE: {value: -1} => throws validation error', () => {
      expect(() => {
        questSelectionIndexContract.parse(-1);
      }).toThrow(/too_small/u);
    });

    it('INVALID_FLOAT: {value: 1.5} => throws validation error', () => {
      expect(() => {
        questSelectionIndexContract.parse(1.5);
      }).toThrow(/invalid_type/u);
    });

    it('INVALID_STRING: {value: "0"} => throws validation error', () => {
      expect(() => {
        questSelectionIndexContract.parse('0');
      }).toThrow(/invalid_type/u);
    });
  });
});
