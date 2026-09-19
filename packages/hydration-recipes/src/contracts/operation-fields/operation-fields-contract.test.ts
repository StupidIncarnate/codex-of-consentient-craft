import { operationFieldsContract } from './operation-fields-contract';
import { OperationFieldsStub } from './operation-fields.stub';

describe('operationFieldsContract', () => {
  describe('valid operation fields', () => {
    it('VALID: {text, role, status, questId, guildId} => parses with locked/flowIds/packageNames defaulted', () => {
      const result = operationFieldsContract.parse({
        text: 'Seeded operation 1',
        role: 'codeweaver',
        status: 'pending',
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      expect(result).toStrictEqual({
        role: 'codeweaver',
        text: 'Seeded operation 1',
        status: 'pending',
        locked: false,
        flowIds: [],
        packageNames: [],
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
    });

    it('VALID: {stub with role override} => parses with the overridden role', () => {
      const result = OperationFieldsStub({ role: 'riftcarver' });

      expect(result.role).toBe('riftcarver');
    });

    it('VALID: {fields plus id} => strips the record-only id field', () => {
      const result = operationFieldsContract.parse({
        text: 'Seeded operation 1',
        role: 'codeweaver',
        status: 'pending',
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
      });

      expect(Object.keys(result).sort()).toStrictEqual(
        [
          'flowIds',
          'guildId',
          'locked',
          'packageNames',
          'questId',
          'role',
          'status',
          'text',
        ].sort(),
      );
    });
  });

  describe('invalid operation fields', () => {
    it('INVALID: {text, role, status — no questId or guildId} => throws "Required"', () => {
      expect(() =>
        operationFieldsContract.parse({
          text: 'Seeded operation 1',
          role: 'codeweaver',
          status: 'pending',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {role: "not-a-role"} => throws "Invalid enum value"', () => {
      expect(() =>
        operationFieldsContract.parse({
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
      expect(() => operationFieldsContract.parse({})).toThrow(/Required/u);
    });
  });
});
