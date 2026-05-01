import { packageTypeContract } from './package-type-contract';
import { PackageTypeStub } from './package-type.stub';

describe('packageTypeContract', () => {
  describe('valid types', () => {
    it('VALID: http-backend => parses successfully', () => {
      const type = PackageTypeStub({ value: 'http-backend' });

      const result = packageTypeContract.parse(type);

      expect(result).toBe('http-backend');
    });

    it('VALID: mcp-server => parses successfully', () => {
      const type = PackageTypeStub({ value: 'mcp-server' });

      const result = packageTypeContract.parse(type);

      expect(result).toBe('mcp-server');
    });

    it('VALID: frontend-react => parses successfully', () => {
      const type = PackageTypeStub({ value: 'frontend-react' });

      const result = packageTypeContract.parse(type);

      expect(result).toBe('frontend-react');
    });

    it('VALID: frontend-ink => parses successfully', () => {
      const type = PackageTypeStub({ value: 'frontend-ink' });

      const result = packageTypeContract.parse(type);

      expect(result).toBe('frontend-ink');
    });

    it('VALID: hook-handlers => parses successfully', () => {
      const type = PackageTypeStub({ value: 'hook-handlers' });

      const result = packageTypeContract.parse(type);

      expect(result).toBe('hook-handlers');
    });

    it('VALID: eslint-plugin => parses successfully', () => {
      const type = PackageTypeStub({ value: 'eslint-plugin' });

      const result = packageTypeContract.parse(type);

      expect(result).toBe('eslint-plugin');
    });

    it('VALID: cli-tool => parses successfully', () => {
      const type = PackageTypeStub({ value: 'cli-tool' });

      const result = packageTypeContract.parse(type);

      expect(result).toBe('cli-tool');
    });

    it('VALID: programmatic-service => parses successfully', () => {
      const type = PackageTypeStub({ value: 'programmatic-service' });

      const result = packageTypeContract.parse(type);

      expect(result).toBe('programmatic-service');
    });

    it('VALID: library => parses successfully', () => {
      const type = PackageTypeStub({ value: 'library' });

      const result = packageTypeContract.parse(type);

      expect(result).toBe('library');
    });
  });

  describe('invalid types', () => {
    it('INVALID: unknown type string => throws validation error', () => {
      expect(() => {
        packageTypeContract.parse('not-a-valid-type');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: empty string => throws validation error', () => {
      expect(() => {
        packageTypeContract.parse('');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
