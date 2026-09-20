import { operationFieldsContract } from '../operation-fields/operation-fields-contract';
import { operationFieldsSchemaContract } from './operation-fields-schema-contract';
import { OperationFieldsSchemaStub } from './operation-fields-schema.stub';

describe('operationFieldsSchemaContract', () => {
  describe('identity with operationFieldsContract', () => {
    it('VALID: {} => is the exact same schema instance, never a re-implementation', () => {
      expect(operationFieldsSchemaContract).toBe(operationFieldsContract);
    });
  });

  describe('valid operation fields', () => {
    it('VALID: {text, role, status, questId, guildId} => parses identically to operationFieldsContract', () => {
      const result = operationFieldsSchemaContract.parse({
        text: 'Seeded operation 1',
        role: 'codeweaver',
        status: 'pending',
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      expect(result).toStrictEqual(OperationFieldsSchemaStub({}));
    });
  });

  describe('invalid operation fields', () => {
    it('INVALID: {role: "not-a-role"} => throws "Invalid enum value"', () => {
      expect(() =>
        operationFieldsSchemaContract.parse({
          text: 'Seeded operation 1',
          role: 'not-a-role',
          status: 'pending',
          questId: 'add-auth',
          guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        }),
      ).toThrow(/Invalid enum value/u);
    });
  });

  describe('empty operation fields', () => {
    it('EMPTY: {} => throws "Required"', () => {
      expect(() => operationFieldsSchemaContract.parse({})).toThrow(/Required/u);
    });
  });
});
