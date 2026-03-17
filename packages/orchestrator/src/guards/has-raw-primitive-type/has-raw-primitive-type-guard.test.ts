import { QuestContractPropertyStub } from '@dungeonmaster/shared/contracts';

import { hasRawPrimitiveTypeGuard } from './has-raw-primitive-type-guard';

type QuestContractProperty = ReturnType<typeof QuestContractPropertyStub>;

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

describe('hasRawPrimitiveTypeGuard', () => {
  describe('properties with raw primitives', () => {
    it('VALID: {property with string type} => returns true', () => {
      const properties = [createPropertyWithRawType({ name: 'name', type: 'string' })];

      const result = hasRawPrimitiveTypeGuard({ properties });

      expect(result).toBe(true);
    });

    it('VALID: {property with number type} => returns true', () => {
      const properties = [createPropertyWithRawType({ name: 'age', type: 'number' })];

      const result = hasRawPrimitiveTypeGuard({ properties });

      expect(result).toBe(true);
    });

    it('VALID: {property with any type} => returns true', () => {
      const properties = [QuestContractPropertyStub({ name: 'data', type: 'any' })];

      const result = hasRawPrimitiveTypeGuard({ properties });

      expect(result).toBe(true);
    });

    it('VALID: {property with object type} => returns true', () => {
      const properties = [QuestContractPropertyStub({ name: 'config', type: 'object' })];

      const result = hasRawPrimitiveTypeGuard({ properties });

      expect(result).toBe(true);
    });

    it('VALID: {property with unknown type} => returns true', () => {
      const properties = [QuestContractPropertyStub({ name: 'payload', type: 'unknown' })];

      const result = hasRawPrimitiveTypeGuard({ properties });

      expect(result).toBe(true);
    });

    it('VALID: {deeply nested property with string type} => returns true', () => {
      const properties = [
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
      ];

      const result = hasRawPrimitiveTypeGuard({ properties });

      expect(result).toBe(true);
    });

    it('VALID: {case-insensitive String type} => returns true', () => {
      const properties = [createPropertyWithRawType({ name: 'name', type: 'String' })];

      const result = hasRawPrimitiveTypeGuard({ properties });

      expect(result).toBe(true);
    });
  });

  describe('properties without raw primitives', () => {
    it('VALID: {property with branded type} => returns false', () => {
      const properties = [QuestContractPropertyStub({ name: 'email', type: 'EmailAddress' })];

      const result = hasRawPrimitiveTypeGuard({ properties });

      expect(result).toBe(false);
    });

    it('VALID: {property with boolean type} => returns false', () => {
      const properties = [QuestContractPropertyStub({ name: 'isActive', type: 'boolean' })];

      const result = hasRawPrimitiveTypeGuard({ properties });

      expect(result).toBe(false);
    });

    it('VALID: {property with void type} => returns false', () => {
      const properties = [QuestContractPropertyStub({ name: 'result', type: 'void' })];

      const result = hasRawPrimitiveTypeGuard({ properties });

      expect(result).toBe(false);
    });

    it('VALID: {property with no type field} => returns false', () => {
      const properties = [QuestContractPropertyStub({ name: 'method', value: 'POST' })];

      const result = hasRawPrimitiveTypeGuard({ properties });

      expect(result).toBe(false);
    });

    it('VALID: {empty properties array} => returns false', () => {
      const result = hasRawPrimitiveTypeGuard({ properties: [] });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {properties: undefined} => returns false', () => {
      const result = hasRawPrimitiveTypeGuard({});

      expect(result).toBe(false);
    });
  });
});
