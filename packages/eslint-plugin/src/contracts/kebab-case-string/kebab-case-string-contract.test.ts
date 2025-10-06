import { kebabCaseStringContract } from './kebab-case-string-contract';

describe('kebabCaseStringContract', () => {
  describe('valid kebab-case strings', () => {
    it('VALID: "kebab-case" => parses successfully', () => {
      expect(kebabCaseStringContract.parse('kebab-case')).toBe('kebab-case');
    });

    it('VALID: "user-fetch-broker" => parses successfully', () => {
      expect(kebabCaseStringContract.parse('user-fetch-broker')).toBe('user-fetch-broker');
    });

    it('VALID: "a" => parses successfully', () => {
      expect(kebabCaseStringContract.parse('a')).toBe('a');
    });

    it('VALID: "test123" => parses successfully', () => {
      expect(kebabCaseStringContract.parse('test123')).toBe('test123');
    });

    it('VALID: "test-123-abc" => parses successfully', () => {
      expect(kebabCaseStringContract.parse('test-123-abc')).toBe('test-123-abc');
    });
  });

  describe('invalid strings', () => {
    it('INVALID_FORMAT: "CamelCase" => throws error', () => {
      expect(() => {
        return kebabCaseStringContract.parse('CamelCase');
      }).toThrow();
    });

    it('INVALID_FORMAT: "snake_case" => throws error', () => {
      expect(() => {
        return kebabCaseStringContract.parse('snake_case');
      }).toThrow();
    });

    it('INVALID_FORMAT: "UPPERCASE" => throws error', () => {
      expect(() => {
        return kebabCaseStringContract.parse('UPPERCASE');
      }).toThrow();
    });

    it('INVALID_FORMAT: "has spaces" => throws error', () => {
      expect(() => {
        return kebabCaseStringContract.parse('has spaces');
      }).toThrow();
    });

    it('INVALID_FORMAT: "-starts-with-hyphen" => throws error', () => {
      expect(() => {
        return kebabCaseStringContract.parse('-starts-with-hyphen');
      }).toThrow();
    });

    it('INVALID_FORMAT: "ends-with-hyphen-" => throws error', () => {
      expect(() => {
        return kebabCaseStringContract.parse('ends-with-hyphen-');
      }).toThrow();
    });

    it('INVALID_FORMAT: "multiple--hyphens" => throws error', () => {
      expect(() => {
        return kebabCaseStringContract.parse('multiple--hyphens');
      }).toThrow();
    });
  });
});
