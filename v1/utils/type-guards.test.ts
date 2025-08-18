import {
  isError,
  isObject,
  isPackageJson,
  parseJsonSafely,
  isClaudeSettings,
  isEslintConfig,
} from './type-guards';

describe('Type Guards', () => {
  describe('isError', () => {
    it('should return true for Error instances', () => {
      expect(isError(new Error('test'))).toBe(true);
      expect(isError(new TypeError('test'))).toBe(true);
      expect(isError(new RangeError('test'))).toBe(true);
    });

    it('should return false for non-Error values', () => {
      expect(isError('error')).toBe(false);
      expect(isError({ message: 'error' })).toBe(false);
      expect(isError(null)).toBe(false);
      expect(isError(undefined)).toBe(false);
      expect(isError(123)).toBe(false);
    });
  });

  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
    });

    it('should return false for non-objects', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject([])).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject(new Date())).toBe(true); // Date is an object
    });
  });

  describe('isPackageJson', () => {
    it('should return true for valid package.json structures', () => {
      expect(isPackageJson({})).toBe(true);
      expect(isPackageJson({ name: 'test' })).toBe(true);
      expect(isPackageJson({ scripts: { test: 'jest' } })).toBe(true);
      expect(isPackageJson({ dependencies: { react: '^18.0.0' } })).toBe(true);
      expect(
        isPackageJson({
          name: 'test',
          scripts: { test: 'jest' },
          dependencies: { react: '^18.0.0' },
          devDependencies: { jest: '^29.0.0' },
        }),
      ).toBe(true);
    });

    it('should return false for invalid structures', () => {
      expect(isPackageJson(null)).toBe(false);
      expect(isPackageJson('not an object')).toBe(false);
      expect(isPackageJson({ scripts: 'not an object' })).toBe(false);
      expect(isPackageJson({ dependencies: [] })).toBe(false);
      expect(isPackageJson({ devDependencies: 'string' })).toBe(false);
    });
  });

  describe('parseJsonSafely', () => {
    it('should parse valid JSON with passing validator', () => {
      const result = parseJsonSafely('{"name": "test"}', isPackageJson);
      expect(result).toStrictEqual({ name: 'test' });
    });

    it('should return null for invalid JSON', () => {
      const result = parseJsonSafely('invalid json', isPackageJson);
      expect(result).toBeNull();
    });

    it('should return null when validator fails', () => {
      const result = parseJsonSafely('{"scripts": "not an object"}', isPackageJson);
      expect(result).toBeNull();
    });
  });

  describe('isClaudeSettings', () => {
    it('should return true for valid Claude settings', () => {
      expect(isClaudeSettings({})).toBe(true);
      expect(isClaudeSettings({ tools: {} })).toBe(true);
      expect(isClaudeSettings({ tools: { Write: {} } })).toBe(true);
      expect(
        isClaudeSettings({
          tools: {
            Write: {
              allowed_paths: ['/path/to/folder'],
            },
          },
        }),
      ).toBe(true);
    });

    it('should return false for invalid structures', () => {
      expect(isClaudeSettings(null)).toBe(false);
      expect(isClaudeSettings('not an object')).toBe(false);
      expect(isClaudeSettings({ tools: 'not an object' })).toBe(false);
    });
  });

  describe('isEslintConfig', () => {
    it('should return true for valid ESLint configs', () => {
      expect(isEslintConfig({})).toBe(true);
      expect(isEslintConfig({ extends: ['eslint:recommended'] })).toBe(true);
      expect(isEslintConfig({ env: { node: true } })).toBe(true);
      expect(isEslintConfig({ rules: { 'no-console': 'off' } })).toBe(true);
      expect(
        isEslintConfig({
          extends: ['eslint:recommended'],
          env: { node: true, es6: true },
          rules: { 'no-console': 'off' },
        }),
      ).toBe(true);
    });

    it('should return false for invalid structures', () => {
      expect(isEslintConfig(null)).toBe(false);
      expect(isEslintConfig('not an object')).toBe(false);
      expect(isEslintConfig({ extends: 'not an array' })).toBe(false);
      expect(isEslintConfig({ env: 'not an object' })).toBe(false);
      expect(isEslintConfig({ rules: [] })).toBe(false);
    });
  });
});
