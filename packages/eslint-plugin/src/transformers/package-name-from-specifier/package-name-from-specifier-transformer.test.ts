import { packageNameFromSpecifierTransformer } from './package-name-from-specifier-transformer';
import { ImportPathStub } from '@dungeonmaster/shared/contracts';

describe('packageNameFromSpecifierTransformer', () => {
  describe('scoped packages', () => {
    it('VALID: {specifier: "@dungeonmaster/npm/zod"} => returns "@dungeonmaster/npm"', () => {
      const result = packageNameFromSpecifierTransformer({
        specifier: ImportPathStub({ value: '@dungeonmaster/npm/zod' }),
      });

      expect(result).toBe('@dungeonmaster/npm');
    });

    it('VALID: {specifier: "@dungeonmaster/npm"} => returns "@dungeonmaster/npm" unchanged', () => {
      const result = packageNameFromSpecifierTransformer({
        specifier: ImportPathStub({ value: '@dungeonmaster/npm' }),
      });

      expect(result).toBe('@dungeonmaster/npm');
    });
  });

  describe('unscoped packages', () => {
    it('VALID: {specifier: "lodash/fp"} => returns "lodash"', () => {
      const result = packageNameFromSpecifierTransformer({
        specifier: ImportPathStub({ value: 'lodash/fp' }),
      });

      expect(result).toBe('lodash');
    });

    it('VALID: {specifier: "zod"} => returns "zod" unchanged', () => {
      const result = packageNameFromSpecifierTransformer({
        specifier: ImportPathStub({ value: 'zod' }),
      });

      expect(result).toBe('zod');
    });
  });
});
