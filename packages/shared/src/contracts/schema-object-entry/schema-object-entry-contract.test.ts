import { SchemaObjectEntryStub } from './schema-object-entry.stub';
import { schemaObjectEntryContract } from './schema-object-entry-contract';

describe('schemaObjectEntryContract', () => {
  describe('valid input', () => {
    it('VALID: {defaults} => returns the id entry', () => {
      expect(SchemaObjectEntryStub()).toStrictEqual({
        key: 'id',
        valueText: "z.string().brand<'ThingId'>()",
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {valueText: missing} => throws ZodError', () => {
      expect(() => schemaObjectEntryContract.parse({ key: 'id' })).toThrow(/expected string/iu);
    });
  });
});
