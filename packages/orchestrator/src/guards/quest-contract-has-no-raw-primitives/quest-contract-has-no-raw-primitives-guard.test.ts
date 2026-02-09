import { QuestContractEntryStub, QuestContractPropertyStub } from '@dungeonmaster/shared/contracts';

import { questContractHasNoRawPrimitivesGuard } from './quest-contract-has-no-raw-primitives-guard';

describe('questContractHasNoRawPrimitivesGuard', () => {
  describe('valid contracts', () => {
    it('VALID: {empty contracts array} => returns true', () => {
      const result = questContractHasNoRawPrimitivesGuard({ contracts: [] });

      expect(result).toBe(true);
    });

    it('VALID: {contracts using branded types} => returns true', () => {
      const contracts = [
        QuestContractEntryStub({
          properties: [
            QuestContractPropertyStub({ name: 'email', type: 'EmailAddress' }),
            QuestContractPropertyStub({ name: 'userId', type: 'UserId' }),
          ],
        }),
      ];

      const result = questContractHasNoRawPrimitivesGuard({ contracts });

      expect(result).toBe(true);
    });

    it('VALID: {property using boolean type} => returns true', () => {
      const contracts = [
        QuestContractEntryStub({
          properties: [QuestContractPropertyStub({ name: 'isActive', type: 'boolean' })],
        }),
      ];

      const result = questContractHasNoRawPrimitivesGuard({ contracts });

      expect(result).toBe(true);
    });

    it('VALID: {property using void type} => returns true', () => {
      const contracts = [
        QuestContractEntryStub({
          properties: [QuestContractPropertyStub({ name: 'result', type: 'void' })],
        }),
      ];

      const result = questContractHasNoRawPrimitivesGuard({ contracts });

      expect(result).toBe(true);
    });

    it('VALID: {property with no type field} => returns true', () => {
      const contracts = [
        QuestContractEntryStub({
          properties: [QuestContractPropertyStub({ name: 'method', value: 'POST' })],
        }),
      ];

      const result = questContractHasNoRawPrimitivesGuard({ contracts });

      expect(result).toBe(true);
    });
  });

  describe('invalid contracts', () => {
    it('INVALID_TYPE: {property using string type} => returns false', () => {
      const contracts = [
        QuestContractEntryStub({
          properties: [QuestContractPropertyStub({ name: 'name', type: 'string' })],
        }),
      ];

      const result = questContractHasNoRawPrimitivesGuard({ contracts });

      expect(result).toBe(false);
    });

    it('INVALID_TYPE: {property using number type} => returns false', () => {
      const contracts = [
        QuestContractEntryStub({
          properties: [QuestContractPropertyStub({ name: 'age', type: 'number' })],
        }),
      ];

      const result = questContractHasNoRawPrimitivesGuard({ contracts });

      expect(result).toBe(false);
    });

    it('INVALID_TYPE: {property using any type} => returns false', () => {
      const contracts = [
        QuestContractEntryStub({
          properties: [QuestContractPropertyStub({ name: 'data', type: 'any' })],
        }),
      ];

      const result = questContractHasNoRawPrimitivesGuard({ contracts });

      expect(result).toBe(false);
    });

    it('INVALID_TYPE: {property using object type} => returns false', () => {
      const contracts = [
        QuestContractEntryStub({
          properties: [QuestContractPropertyStub({ name: 'config', type: 'object' })],
        }),
      ];

      const result = questContractHasNoRawPrimitivesGuard({ contracts });

      expect(result).toBe(false);
    });

    it('INVALID_TYPE: {property using unknown type} => returns false', () => {
      const contracts = [
        QuestContractEntryStub({
          properties: [QuestContractPropertyStub({ name: 'payload', type: 'unknown' })],
        }),
      ];

      const result = questContractHasNoRawPrimitivesGuard({ contracts });

      expect(result).toBe(false);
    });

    it('INVALID_TYPE: {deeply nested property using string type} => returns false', () => {
      const contracts = [
        QuestContractEntryStub({
          properties: [
            QuestContractPropertyStub({
              name: 'user',
              type: 'User',
              properties: [
                QuestContractPropertyStub({
                  name: 'address',
                  type: 'Address',
                  properties: [QuestContractPropertyStub({ name: 'street', type: 'string' })],
                }),
              ],
            }),
          ],
        }),
      ];

      const result = questContractHasNoRawPrimitivesGuard({ contracts });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {mix of valid and one invalid property} => returns false', () => {
      const contracts = [
        QuestContractEntryStub({
          properties: [
            QuestContractPropertyStub({ name: 'email', type: 'EmailAddress' }),
            QuestContractPropertyStub({ name: 'name', type: 'string' }),
            QuestContractPropertyStub({ name: 'isActive', type: 'boolean' }),
          ],
        }),
      ];

      const result = questContractHasNoRawPrimitivesGuard({ contracts });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {contracts: undefined} => returns false', () => {
      const result = questContractHasNoRawPrimitivesGuard({});

      expect(result).toBe(false);
    });
  });
});
