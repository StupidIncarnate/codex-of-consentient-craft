import { frameworkContract } from './framework-contract';
import { FrameworkStub } from './framework.stub';

describe('frameworkContract', () => {
  describe('valid frameworks', () => {
    it('VALID: "react" => parses successfully', () => {
      const framework = frameworkContract.parse('react');

      expect(framework).toBe('react');
    });

    it('VALID: "express" => parses successfully', () => {
      const framework = frameworkContract.parse('express');

      expect(framework).toBe('express');
    });

    it('VALID: "nextjs" => parses successfully', () => {
      const framework = frameworkContract.parse('nextjs');

      expect(framework).toBe('nextjs');
    });

    it('VALID: stub with default => parses as react', () => {
      const framework = FrameworkStub();

      const result = frameworkContract.parse(framework);

      expect(result).toBe('react');
    });

    it('VALID: stub with override => parses with custom value', () => {
      const framework = FrameworkStub({ value: 'vue' });

      const result = frameworkContract.parse(framework);

      expect(result).toBe('vue');
    });
  });

  describe('invalid frameworks', () => {
    it('INVALID_VALUE: "invalid" => throws validation error', () => {
      expect(() => {
        return frameworkContract.parse('invalid');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_TYPE: 123 => throws validation error', () => {
      expect(() => {
        return frameworkContract.parse(123);
      }).toThrow(/Expected/u);
    });

    it('INVALID_UNDEFINED: undefined => throws validation error', () => {
      expect(() => {
        return frameworkContract.parse(undefined);
      }).toThrow(/Required/u);
    });
  });
});
