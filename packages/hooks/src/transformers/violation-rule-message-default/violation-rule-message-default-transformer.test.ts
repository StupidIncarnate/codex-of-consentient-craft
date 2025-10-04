import { violationRuleMessageDefaultTransformer } from './violation-rule-message-default-transformer';

describe('violationRuleMessageDefaultTransformer()', () => {
  describe('known rules', () => {
    it('VALID: {ruleId: "@typescript-eslint/no-explicit-any"} => returns type safety message', () => {
      const result = violationRuleMessageDefaultTransformer({
        ruleId: '@typescript-eslint/no-explicit-any',
      });
      expect(result).toBe(
        'Using type "any" violates TypeScript\'s type safety rules. Go explore types for this project and use a known or make a new type to use.',
      );
    });

    it('VALID: {ruleId: "@typescript-eslint/ban-ts-comment"} => returns comment suppression message', () => {
      const result = violationRuleMessageDefaultTransformer({
        ruleId: '@typescript-eslint/ban-ts-comment',
      });
      expect(result).toBe(
        'TypeScript error suppression comments (@ts-ignore, @ts-expect-error) cannot be used. Explore root cause and fix the underlying issue.',
      );
    });

    it('VALID: {ruleId: "eslint-comments/no-use"} => returns eslint disable message', () => {
      const result = violationRuleMessageDefaultTransformer({
        ruleId: 'eslint-comments/no-use',
      });
      expect(result).toBe(
        'ESLint disable comments should not be used. Explore root cause and fix the underlying issue',
      );
    });
  });

  describe('unknown rules', () => {
    it('VALID: {ruleId: "unknown-rule"} => returns default message', () => {
      const result = violationRuleMessageDefaultTransformer({ ruleId: 'unknown-rule' });
      expect(result).toBe('This rule violation should be fixed to maintain code quality.');
    });

    it('VALID: {ruleId: "prefer-const"} => returns default message', () => {
      const result = violationRuleMessageDefaultTransformer({ ruleId: 'prefer-const' });
      expect(result).toBe('This rule violation should be fixed to maintain code quality.');
    });

    it('VALID: {ruleId: "no-console"} => returns default message', () => {
      const result = violationRuleMessageDefaultTransformer({ ruleId: 'no-console' });
      expect(result).toBe('This rule violation should be fixed to maintain code quality.');
    });

    it('VALID: {ruleId: "custom-rule-123"} => returns default message', () => {
      const result = violationRuleMessageDefaultTransformer({ ruleId: 'custom-rule-123' });
      expect(result).toBe('This rule violation should be fixed to maintain code quality.');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {ruleId: ""} => returns default message', () => {
      const result = violationRuleMessageDefaultTransformer({ ruleId: '' });
      expect(result).toBe('This rule violation should be fixed to maintain code quality.');
    });

    it('EDGE: {ruleId: "   "} => returns default message', () => {
      const result = violationRuleMessageDefaultTransformer({ ruleId: '   ' });
      expect(result).toBe('This rule violation should be fixed to maintain code quality.');
    });

    it('EDGE: {ruleId: "@typescript-eslint/NO-EXPLICIT-ANY"} => returns default message (case sensitive)', () => {
      const result = violationRuleMessageDefaultTransformer({
        ruleId: '@typescript-eslint/NO-EXPLICIT-ANY',
      });
      expect(result).toBe('This rule violation should be fixed to maintain code quality.');
    });
  });
});
