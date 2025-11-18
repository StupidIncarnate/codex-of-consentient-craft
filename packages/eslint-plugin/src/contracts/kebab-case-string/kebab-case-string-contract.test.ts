import { KebabCaseStringStub } from './kebab-case-string.stub';
import { kebabCaseStringContract } from './kebab-case-string-contract';

describe('KebabCaseStringStub', () => {
  describe('valid kebab-case strings', () => {
    it('VALID: {value: "kebab-case"} => returns branded KebabCaseString', () => {
      expect(KebabCaseStringStub({ value: 'kebab-case' })).toBe('kebab-case');
    });

    it('VALID: {value: "user-fetch-broker"} => returns branded KebabCaseString', () => {
      expect(KebabCaseStringStub({ value: 'user-fetch-broker' })).toBe('user-fetch-broker');
    });

    it('VALID: {value: "a"} => returns branded KebabCaseString', () => {
      expect(KebabCaseStringStub({ value: 'a' })).toBe('a');
    });

    it('VALID: {value: "test123"} => returns branded KebabCaseString', () => {
      expect(KebabCaseStringStub({ value: 'test123' })).toBe('test123');
    });

    it('VALID: {value: "test-123-abc"} => returns branded KebabCaseString', () => {
      expect(KebabCaseStringStub({ value: 'test-123-abc' })).toBe('test-123-abc');
    });

    it('VALID: {} => returns default kebab-case string', () => {
      expect(KebabCaseStringStub()).toBe('test-string');
    });
  });

  describe('invalid strings', () => {
    it('INVALID_FORMAT: {value: "CamelCase"} => throws ZodError', () => {
      expect(() => {
        kebabCaseStringContract.parse('CamelCase');
      }).toThrow('Must be kebab-case');
    });

    it('INVALID_FORMAT: {value: "snake_case"} => throws ZodError', () => {
      expect(() => {
        KebabCaseStringStub({ value: 'snake_case' });
      }).toThrow('Must be kebab-case');
    });

    it('INVALID_FORMAT: {value: "UPPERCASE"} => throws ZodError', () => {
      expect(() => {
        KebabCaseStringStub({ value: 'UPPERCASE' });
      }).toThrow('Must be kebab-case');
    });

    it('INVALID_FORMAT: {value: "has spaces"} => throws ZodError', () => {
      expect(() => {
        KebabCaseStringStub({ value: 'has spaces' });
      }).toThrow('Must be kebab-case');
    });

    it('INVALID_FORMAT: {value: "-starts-with-hyphen"} => throws ZodError', () => {
      expect(() => {
        KebabCaseStringStub({ value: '-starts-with-hyphen' });
      }).toThrow('Must be kebab-case');
    });

    it('INVALID_FORMAT: {value: "ends-with-hyphen-"} => throws ZodError', () => {
      expect(() => {
        KebabCaseStringStub({ value: 'ends-with-hyphen-' });
      }).toThrow('Must be kebab-case');
    });

    it('INVALID_FORMAT: {value: "multiple--hyphens"} => throws ZodError', () => {
      expect(() => {
        KebabCaseStringStub({ value: 'multiple--hyphens' });
      }).toThrow('Must be kebab-case');
    });
  });
});
