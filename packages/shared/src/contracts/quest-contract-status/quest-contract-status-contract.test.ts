import { questContractStatusContract } from './quest-contract-status-contract';
import { QuestContractStatusStub } from './quest-contract-status.stub';

describe('questContractStatusContract', () => {
  describe('valid statuses', () => {
    it('VALID: {value: "new"} => parses successfully', () => {
      const status = QuestContractStatusStub({ value: 'new' });

      const result = questContractStatusContract.parse(status);

      expect(result).toBe('new');
    });

    it('VALID: {value: "existing"} => parses successfully', () => {
      const status = QuestContractStatusStub({ value: 'existing' });

      const result = questContractStatusContract.parse(status);

      expect(result).toBe('existing');
    });

    it('VALID: {value: "modified"} => parses successfully', () => {
      const status = QuestContractStatusStub({ value: 'modified' });

      const result = questContractStatusContract.parse(status);

      expect(result).toBe('modified');
    });

    it('VALID: {default} => uses default new', () => {
      const status = QuestContractStatusStub();

      expect(status).toBe('new');
    });
  });

  describe('invalid statuses', () => {
    it('INVALID_STATUS: {value: "invalid"} => throws validation error', () => {
      expect(() => {
        return questContractStatusContract.parse('invalid');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_STATUS: {value: ""} => throws validation error', () => {
      expect(() => {
        return questContractStatusContract.parse('');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
