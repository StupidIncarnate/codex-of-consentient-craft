import { QuestContractEntryStub, ContractNameStub } from '@dungeonmaster/shared/contracts';

import { questContractNamesUniqueGuard } from './quest-contract-names-unique-guard';

describe('questContractNamesUniqueGuard', () => {
  describe('unique names', () => {
    it('VALID: {two contracts with distinct names} => returns true', () => {
      const contracts = [
        QuestContractEntryStub({ name: ContractNameStub({ value: 'LoginCredentials' }) }),
        QuestContractEntryStub({ name: ContractNameStub({ value: 'UserProfile' }) }),
      ];

      const result = questContractNamesUniqueGuard({ contracts });

      expect(result).toBe(true);
    });

    it('VALID: {empty contracts array} => returns true', () => {
      const result = questContractNamesUniqueGuard({ contracts: [] });

      expect(result).toBe(true);
    });
  });

  describe('duplicate names', () => {
    it('INVALID: {two contracts with same name} => returns false', () => {
      const contracts = [
        QuestContractEntryStub({ name: ContractNameStub({ value: 'LoginCredentials' }) }),
        QuestContractEntryStub({ name: ContractNameStub({ value: 'LoginCredentials' }) }),
      ];

      const result = questContractNamesUniqueGuard({ contracts });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {contracts: undefined} => returns false', () => {
      const result = questContractNamesUniqueGuard({});

      expect(result).toBe(false);
    });
  });
});
