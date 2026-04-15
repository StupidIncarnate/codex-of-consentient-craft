import { QuestContractEntryStub } from '@dungeonmaster/shared/contracts';

import { questDuplicateContractNamesTransformer } from './quest-duplicate-contract-names-transformer';

describe('questDuplicateContractNamesTransformer', () => {
  describe('no duplicates', () => {
    it('VALID: {unique names} => returns []', () => {
      const contracts = [
        QuestContractEntryStub({ id: 'a' as never, name: 'First' as never }),
        QuestContractEntryStub({ id: 'b' as never, name: 'Second' as never }),
      ];

      const result = questDuplicateContractNamesTransformer({ contracts });

      expect(result).toStrictEqual([]);
    });
  });

  describe('duplicates present', () => {
    it('INVALID: {two contracts share name} => returns the name', () => {
      const contracts = [
        QuestContractEntryStub({ id: 'a' as never, name: 'LoginCredentials' as never }),
        QuestContractEntryStub({ id: 'b' as never, name: 'LoginCredentials' as never }),
      ];

      const result = questDuplicateContractNamesTransformer({ contracts });

      expect(result).toStrictEqual(['LoginCredentials']);
    });
  });

  describe('empty', () => {
    it('EMPTY: {contracts: undefined} => returns []', () => {
      const result = questDuplicateContractNamesTransformer({});

      expect(result).toStrictEqual([]);
    });
  });
});
