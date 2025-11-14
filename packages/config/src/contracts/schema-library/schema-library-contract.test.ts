import { schemaLibraryContract } from './schema-library-contract';
import { SchemaLibraryStub } from './schema-library.stub';

describe('schemaLibraryContract', () => {
  describe('valid schema libraries', () => {
    it('VALID: "zod" => parses successfully', () => {
      const library = schemaLibraryContract.parse('zod');

      expect(library).toBe('zod');
    });

    it('VALID: "yup" => parses successfully', () => {
      const library = schemaLibraryContract.parse('yup');

      expect(library).toBe('yup');
    });

    it('VALID: stub with default => parses as zod', () => {
      const library = SchemaLibraryStub();

      const result = schemaLibraryContract.parse(library);

      expect(result).toBe('zod');
    });

    it('VALID: stub with override => parses with custom value', () => {
      const library = SchemaLibraryStub({ value: 'joi' });

      const result = schemaLibraryContract.parse(library);

      expect(result).toBe('joi');
    });
  });

  describe('invalid schema libraries', () => {
    it('INVALID_VALUE: "invalid" => throws validation error', () => {
      expect(() => {
        return schemaLibraryContract.parse('invalid');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_TYPE: 123 => throws validation error', () => {
      expect(() => {
        return schemaLibraryContract.parse(123);
      }).toThrow(/Expected/u);
    });

    it('INVALID_UNDEFINED: undefined => throws validation error', () => {
      expect(() => {
        return schemaLibraryContract.parse(undefined);
      }).toThrow(/Required/u);
    });
  });
});
