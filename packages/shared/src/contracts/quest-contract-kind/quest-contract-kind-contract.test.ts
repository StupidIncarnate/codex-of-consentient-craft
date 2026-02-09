import { questContractKindContract } from './quest-contract-kind-contract';
import { QuestContractKindStub } from './quest-contract-kind.stub';

describe('questContractKindContract', () => {
  describe('valid kinds', () => {
    it('VALID: {value: "data"} => parses successfully', () => {
      const kind = QuestContractKindStub({ value: 'data' });

      const result = questContractKindContract.parse(kind);

      expect(result).toBe('data');
    });

    it('VALID: {value: "endpoint"} => parses successfully', () => {
      const kind = QuestContractKindStub({ value: 'endpoint' });

      const result = questContractKindContract.parse(kind);

      expect(result).toBe('endpoint');
    });

    it('VALID: {value: "event"} => parses successfully', () => {
      const kind = QuestContractKindStub({ value: 'event' });

      const result = questContractKindContract.parse(kind);

      expect(result).toBe('event');
    });

    it('VALID: {default} => uses default data', () => {
      const kind = QuestContractKindStub();

      expect(kind).toBe('data');
    });
  });

  describe('invalid kinds', () => {
    it('INVALID_KIND: {value: "invalid"} => throws validation error', () => {
      expect(() => {
        return questContractKindContract.parse('invalid');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_KIND: {value: ""} => throws validation error', () => {
      expect(() => {
        return questContractKindContract.parse('');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
