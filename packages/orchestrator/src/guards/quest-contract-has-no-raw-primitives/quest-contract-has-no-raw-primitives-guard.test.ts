import { QuestContractEntryStub, QuestContractPropertyStub } from '@dungeonmaster/shared/contracts';

import { questContractHasNoRawPrimitivesGuard } from './quest-contract-has-no-raw-primitives-guard';

type QuestContractProperty = ReturnType<typeof QuestContractPropertyStub>;
type QuestContractEntry = ReturnType<typeof QuestContractEntryStub>;

/**
 * Creates a QuestContractProperty with a raw primitive type that bypasses Zod validation.
 * The Zod contract now rejects "string" and "number" at parse time, but the guard still
 * needs to handle data from external sources that bypasses Zod parsing.
 */
const createPropertyWithRawType = (overrides: {
  name?: string;
  type: string;
  properties?: QuestContractProperty[];
}): QuestContractProperty => {
  const base = QuestContractPropertyStub({ name: overrides.name ?? 'stub' });

  return {
    ...base,
    type: overrides.type,
    ...(overrides.properties ? { properties: overrides.properties } : {}),
  } as QuestContractProperty;
};

/**
 * Creates a QuestContractEntry with pre-built properties, bypassing Zod validation on
 * the entry stub. Required when properties contain raw primitive types that Zod rejects.
 */
const createEntryWithProperties = (properties: QuestContractProperty[]): QuestContractEntry => {
  const base = QuestContractEntryStub();

  return {
    ...base,
    properties,
  } as QuestContractEntry;
};

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
        createEntryWithProperties([createPropertyWithRawType({ name: 'name', type: 'string' })]),
      ];

      const result = questContractHasNoRawPrimitivesGuard({ contracts });

      expect(result).toBe(false);
    });

    it('INVALID_TYPE: {property using number type} => returns false', () => {
      const contracts = [
        createEntryWithProperties([createPropertyWithRawType({ name: 'age', type: 'number' })]),
      ];

      const result = questContractHasNoRawPrimitivesGuard({ contracts });

      expect(result).toBe(false);
    });

    it('INVALID_TYPE: {property using any type} => returns false', () => {
      const contracts = [
        createEntryWithProperties([createPropertyWithRawType({ name: 'data', type: 'any' })]),
      ];

      const result = questContractHasNoRawPrimitivesGuard({ contracts });

      expect(result).toBe(false);
    });

    it('INVALID_TYPE: {property using object type} => returns false', () => {
      const contracts = [
        createEntryWithProperties([createPropertyWithRawType({ name: 'config', type: 'object' })]),
      ];

      const result = questContractHasNoRawPrimitivesGuard({ contracts });

      expect(result).toBe(false);
    });

    it('INVALID_TYPE: {property using unknown type} => returns false', () => {
      const contracts = [
        createEntryWithProperties([
          createPropertyWithRawType({ name: 'payload', type: 'unknown' }),
        ]),
      ];

      const result = questContractHasNoRawPrimitivesGuard({ contracts });

      expect(result).toBe(false);
    });

    it('INVALID_TYPE: {deeply nested property using string type} => returns false', () => {
      const contracts = [
        createEntryWithProperties([
          createPropertyWithRawType({
            name: 'user',
            type: 'User',
            properties: [
              createPropertyWithRawType({
                name: 'address',
                type: 'Address',
                properties: [createPropertyWithRawType({ name: 'street', type: 'string' })],
              }),
            ],
          }),
        ]),
      ];

      const result = questContractHasNoRawPrimitivesGuard({ contracts });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {mix of valid and one invalid property} => returns false', () => {
      const contracts = [
        createEntryWithProperties([
          QuestContractPropertyStub({ name: 'email', type: 'EmailAddress' }),
          createPropertyWithRawType({ name: 'name', type: 'string' }),
          QuestContractPropertyStub({ name: 'isActive', type: 'boolean' }),
        ]),
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
