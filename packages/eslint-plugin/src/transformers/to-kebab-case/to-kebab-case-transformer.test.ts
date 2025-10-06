import { toKebabCaseTransformer } from './to-kebab-case-transformer';

describe('toKebabCaseTransformer', () => {
  describe('camelCase inputs', () => {
    it('VALID: {str: "camelCase"} => returns "camel-case"', () => {
      expect(toKebabCaseTransformer({ str: 'camelCase' })).toBe('camel-case');
    });

    it('VALID: {str: "eslintRuleTester"} => returns "eslint-rule-tester"', () => {
      expect(toKebabCaseTransformer({ str: 'eslintRuleTester' })).toBe('eslint-rule-tester');
    });

    it('VALID: {str: "someVariableName"} => returns "some-variable-name"', () => {
      expect(toKebabCaseTransformer({ str: 'someVariableName' })).toBe('some-variable-name');
    });
  });

  describe('PascalCase inputs', () => {
    it('VALID: {str: "PascalCase"} => returns "pascal-case"', () => {
      expect(toKebabCaseTransformer({ str: 'PascalCase' })).toBe('pascal-case');
    });

    it('VALID: {str: "UserFetchBroker"} => returns "user-fetch-broker"', () => {
      expect(toKebabCaseTransformer({ str: 'UserFetchBroker' })).toBe('user-fetch-broker');
    });
  });

  describe('snake_case inputs', () => {
    it('VALID: {str: "snake_case"} => returns "snake-case"', () => {
      expect(toKebabCaseTransformer({ str: 'snake_case' })).toBe('snake-case');
    });

    it('VALID: {str: "user_fetch_broker"} => returns "user-fetch-broker"', () => {
      expect(toKebabCaseTransformer({ str: 'user_fetch_broker' })).toBe('user-fetch-broker');
    });
  });

  describe('mixed case inputs', () => {
    it('VALID: {str: "UserFetch_Broker"} => returns "user-fetch-broker"', () => {
      expect(toKebabCaseTransformer({ str: 'UserFetch_Broker' })).toBe('user-fetch-broker');
    });

    it('VALID: {str: "User Fetch Broker"} => returns "user-fetch-broker"', () => {
      expect(toKebabCaseTransformer({ str: 'User Fetch Broker' })).toBe('user-fetch-broker');
    });
  });

  describe('already kebab-case', () => {
    it('VALID: {str: "kebab-case"} => returns "kebab-case"', () => {
      expect(toKebabCaseTransformer({ str: 'kebab-case' })).toBe('kebab-case');
    });

    it('VALID: {str: "user-fetch-broker"} => returns "user-fetch-broker"', () => {
      expect(toKebabCaseTransformer({ str: 'user-fetch-broker' })).toBe('user-fetch-broker');
    });
  });

  describe('edge cases', () => {
    it('VALID: {str: "a"} => returns "a"', () => {
      expect(toKebabCaseTransformer({ str: 'a' })).toBe('a');
    });

    it('VALID: {str: "ABC"} => returns "abc"', () => {
      expect(toKebabCaseTransformer({ str: 'ABC' })).toBe('abc');
    });

    it('VALID: {str: "multiple---hyphens"} => returns "multiple-hyphens"', () => {
      expect(toKebabCaseTransformer({ str: 'multiple---hyphens' })).toBe('multiple-hyphens');
    });
  });
});
