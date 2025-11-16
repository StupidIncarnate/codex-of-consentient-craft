import { isValidSchemaLibraryGuard } from './is-valid-schema-library-guard';

describe('isValidSchemaLibraryGuard', () => {
  describe('valid schema libraries', () => {
    it('VALID: {library: "zod"} => returns true', () => {
      const result = isValidSchemaLibraryGuard({ library: 'zod' });

      expect(result).toBe(true);
    });

    it('VALID: {library: "yup"} => returns true', () => {
      const result = isValidSchemaLibraryGuard({ library: 'yup' });

      expect(result).toBe(true);
    });

    it('VALID: {library: "joi"} => returns true', () => {
      const result = isValidSchemaLibraryGuard({ library: 'joi' });

      expect(result).toBe(true);
    });

    it('VALID: {library: "ajv"} => returns true', () => {
      const result = isValidSchemaLibraryGuard({ library: 'ajv' });

      expect(result).toBe(true);
    });
  });

  describe('invalid schema libraries', () => {
    it('INVALID_VALUE: {library: "invalid"} => returns false', () => {
      const result = isValidSchemaLibraryGuard({ library: 'invalid' });

      expect(result).toBe(false);
    });

    it('INVALID_TYPE: {library: 123} => returns false', () => {
      const result = isValidSchemaLibraryGuard({ library: 123 });

      expect(result).toBe(false);
    });

    it('INVALID_UNDEFINED: {library: undefined} => returns false', () => {
      const result = isValidSchemaLibraryGuard({});

      expect(result).toBe(false);
    });

    it('INVALID_NULL: {library: null} => returns false', () => {
      const result = isValidSchemaLibraryGuard({ library: null });

      expect(result).toBe(false);
    });
  });
});
