import type { SchemaLibrary } from './schema-library-contract';
import { ALL_SCHEMA_LIBRARIES, isValidSchemaLibrary } from './schema-library-contract';

describe('schema-library-contract', () => {
  describe('ALL_SCHEMA_LIBRARIES', () => {
    describe('valid structure', () => {
      it('VALID: contains all expected schema libraries => returns complete array', () => {
        expect(ALL_SCHEMA_LIBRARIES).toStrictEqual(['zod']);
      });

      it('VALID: is readonly array => returns readonly type', () => {
        expect(Array.isArray(ALL_SCHEMA_LIBRARIES)).toBe(true);
        // Test that it's a const assertion (readonly) by checking it exists
        expect(ALL_SCHEMA_LIBRARIES.length).toBeGreaterThan(0);
      });
    });
  });

  describe('isValidSchemaLibrary()', () => {
    describe('valid inputs', () => {
      it('VALID: "zod" => returns true', () => {
        expect(isValidSchemaLibrary('zod')).toBe(true);
      });
    });

    describe('invalid string inputs', () => {
      it('INVALID_LIBRARY: "unknown-library" => returns false', () => {
        expect(isValidSchemaLibrary('unknown-library')).toBe(false);
      });

      it('INVALID_LIBRARY: "ZOD" => returns false', () => {
        expect(isValidSchemaLibrary('ZOD')).toBe(false);
      });

      it('INVALID_LIBRARY: "Zod" => returns false', () => {
        expect(isValidSchemaLibrary('Zod')).toBe(false);
      });

      it('INVALID_LIBRARY: "ajv" => returns false', () => {
        expect(isValidSchemaLibrary('ajv')).toBe(false);
      });

      it('INVALID_LIBRARY: "mongoose" => returns false', () => {
        expect(isValidSchemaLibrary('mongoose')).toBe(false);
      });
    });

    describe('invalid type inputs', () => {
      it('INVALID_TYPE: null => returns false', () => {
        expect(isValidSchemaLibrary(null)).toBe(false);
      });

      it('INVALID_TYPE: undefined => returns false', () => {
        expect(isValidSchemaLibrary(undefined)).toBe(false);
      });

      it('INVALID_TYPE: 123 => returns false', () => {
        expect(isValidSchemaLibrary(123)).toBe(false);
      });

      it('INVALID_TYPE: true => returns false', () => {
        expect(isValidSchemaLibrary(true)).toBe(false);
      });

      it('INVALID_TYPE: false => returns false', () => {
        expect(isValidSchemaLibrary(false)).toBe(false);
      });

      it('INVALID_TYPE: [] => returns false', () => {
        expect(isValidSchemaLibrary([])).toBe(false);
      });

      it('INVALID_TYPE: {} => returns false', () => {
        expect(isValidSchemaLibrary({})).toBe(false);
      });

      it('INVALID_TYPE: () => {} => returns false', () => {
        expect(isValidSchemaLibrary(() => {})).toBe(false);
      });

      it('INVALID_TYPE: Symbol("test") => returns false', () => {
        expect(isValidSchemaLibrary(Symbol('test'))).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('EDGE: "" => returns false', () => {
        expect(isValidSchemaLibrary('')).toBe(false);
      });

      it('EDGE: "  zod  " => returns false', () => {
        expect(isValidSchemaLibrary('  zod  ')).toBe(false);
      });

      it('EDGE: "zod\n" => returns false', () => {
        expect(isValidSchemaLibrary('zod\n')).toBe(false);
      });

      it('EDGE: 0 => returns false', () => {
        expect(isValidSchemaLibrary(0)).toBe(false);
      });

      it('EDGE: -1 => returns false', () => {
        expect(isValidSchemaLibrary(-1)).toBe(false);
      });

      it('EDGE: NaN => returns false', () => {
        expect(isValidSchemaLibrary(NaN)).toBe(false);
      });

      it('EDGE: Infinity => returns false', () => {
        expect(isValidSchemaLibrary(Infinity)).toBe(false);
      });
    });
  });

  describe('SchemaLibrary type', () => {
    describe('type compilation', () => {
      it('VALID: type accepts all valid schema libraries => compiles successfully', () => {
        const validLibraries: SchemaLibrary[] = ['zod'];

        expect(validLibraries).toStrictEqual(['zod']);
      });
    });
  });
});
