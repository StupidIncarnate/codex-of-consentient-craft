import { questFieldsContract } from '../quest-fields/quest-fields-contract';
import { questFieldsSchemaContract } from './quest-fields-schema-contract';
import { QuestFieldsSchemaStub } from './quest-fields-schema.stub';

describe('questFieldsSchemaContract', () => {
  describe('identity with questFieldsContract', () => {
    it('VALID: {} => is the exact same schema instance, never a re-implementation', () => {
      expect(questFieldsSchemaContract).toBe(questFieldsContract);
    });
  });

  describe('valid quest fields', () => {
    it('VALID: {title, status, userRequest, guildId} => parses identically to questFieldsContract', () => {
      const result = questFieldsSchemaContract.parse({
        title: 'Quest 1',
        status: 'created',
        userRequest: 'seeded quest 1',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      expect(result).toStrictEqual(QuestFieldsSchemaStub({}));
    });
  });

  describe('invalid quest fields', () => {
    it('INVALID: {status: "not-a-status"} => throws "Invalid enum value"', () => {
      expect(() =>
        questFieldsSchemaContract.parse({
          title: 'Quest 1',
          status: 'not-a-status',
          userRequest: 'seeded quest 1',
          guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        }),
      ).toThrow(/Invalid enum value/u);
    });
  });

  describe('empty quest fields', () => {
    it('EMPTY: {} => throws "Required"', () => {
      expect(() => questFieldsSchemaContract.parse({})).toThrow(/Required/u);
    });
  });
});
