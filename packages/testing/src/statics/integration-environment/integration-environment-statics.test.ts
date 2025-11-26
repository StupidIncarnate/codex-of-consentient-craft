import { integrationEnvironmentStatics } from './integration-environment-statics';

describe('integrationEnvironmentStatics', () => {
  describe('constants', () => {
    it('VALID: randomBytesLength => returns 4', () => {
      const result = integrationEnvironmentStatics.constants.randomBytesLength;

      expect(result).toBe(4);
    });

    it('VALID: jsonIndentSpaces => returns 2', () => {
      const result = integrationEnvironmentStatics.constants.jsonIndentSpaces;

      expect(result).toBe(2);
    });
  });

  describe('paths', () => {
    it('VALID: baseDir => returns "/tmp"', () => {
      const result = integrationEnvironmentStatics.paths.baseDir;

      expect(result).toBe('/tmp');
    });
  });

  describe('packageJson', () => {
    it('VALID: version => returns "1.0.0"', () => {
      const result = integrationEnvironmentStatics.packageJson.version;

      expect(result).toBe('1.0.0');
    });

    it('VALID: scripts.test => returns test placeholder', () => {
      const result = integrationEnvironmentStatics.packageJson.scripts.test;

      expect(result).toBe('echo "test placeholder"');
    });

    it('VALID: scripts.lint => returns lint placeholder', () => {
      const result = integrationEnvironmentStatics.packageJson.scripts.lint;

      expect(result).toBe('echo "lint placeholder"');
    });

    it('VALID: scripts.typecheck => returns typecheck placeholder', () => {
      const result = integrationEnvironmentStatics.packageJson.scripts.typecheck;

      expect(result).toBe('echo "typecheck placeholder"');
    });
  });

  describe('tsconfig', () => {
    it('VALID: compilerOptions.target => returns "ES2020"', () => {
      const result = integrationEnvironmentStatics.tsconfig.compilerOptions.target;

      expect(result).toBe('ES2020');
    });

    it('VALID: compilerOptions.strict => returns true', () => {
      const result = integrationEnvironmentStatics.tsconfig.compilerOptions.strict;

      expect(result).toBe(true);
    });

    it('VALID: include => contains TypeScript file patterns', () => {
      const result = integrationEnvironmentStatics.tsconfig.include;

      expect(result).toStrictEqual(['**/*.ts', '**/*.tsx']);
    });

    it('VALID: exclude => contains node_modules', () => {
      const result = integrationEnvironmentStatics.tsconfig.exclude;

      expect(result).toStrictEqual(['node_modules']);
    });
  });

  describe('eslintConfig', () => {
    it('VALID: template => contains parser configuration', () => {
      const result = integrationEnvironmentStatics.eslintConfig.template;
      const hasParser = result.includes('@typescript-eslint/parser');
      const hasModuleExports = result.includes('module.exports');

      expect(hasParser).toBe(true);
      expect(hasModuleExports).toBe(true);
    });
  });
});
