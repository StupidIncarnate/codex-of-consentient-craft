import { QuestContractEntryStub, QuestContractPropertyStub } from '@dungeonmaster/shared/contracts';

import { questContractRawPrimitivePropertiesTransformer } from './quest-contract-raw-primitive-properties-transformer';

describe('questContractRawPrimitivePropertiesTransformer', () => {
  describe('no raw primitives', () => {
    it('VALID: {branded types only} => returns []', () => {
      const contract = QuestContractEntryStub();

      const result = questContractRawPrimitivePropertiesTransformer({ contracts: [contract] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('raw primitives present', () => {
    it('INVALID: {property uses "string"} => returns description', () => {
      const rawProperty = QuestContractPropertyStub({ name: 'password' as never });
      Object.assign(rawProperty, { type: 'string' });
      const contract = QuestContractEntryStub({ name: 'LoginCredentials' as never });
      Object.assign(contract, { properties: [rawProperty] });

      const result = questContractRawPrimitivePropertiesTransformer({ contracts: [contract] });

      expect(result).toStrictEqual([
        "contract 'LoginCredentials' property 'password' uses raw primitive 'string'",
      ]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {contracts: undefined} => returns []', () => {
      const result = questContractRawPrimitivePropertiesTransformer({});

      expect(result).toStrictEqual([]);
    });
  });
});
