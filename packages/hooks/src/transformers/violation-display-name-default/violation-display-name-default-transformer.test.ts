import { violationDisplayNameDefaultTransformer } from './violation-display-name-default-transformer';

describe('violationDisplayNameDefaultTransformer()', () => {
  describe('known rules', () => {
    it('VALID: {ruleId: "@typescript-eslint/no-explicit-any"} => returns "Type Safety Violation"', () => {
      const result = violationDisplayNameDefaultTransformer({
        ruleId: '@typescript-eslint/no-explicit-any',
      });

      expect(result).toBe('Type Safety Violation');
    });

    it('VALID: {ruleId: "@typescript-eslint/ban-ts-comment"} => returns "Type Error Suppression"', () => {
      const result = violationDisplayNameDefaultTransformer({
        ruleId: '@typescript-eslint/ban-ts-comment',
      });

      expect(result).toBe('Type Error Suppression');
    });

    it('VALID: {ruleId: "eslint-comments/no-use"} => returns "Code Quality Rule Bypass"', () => {
      const result = violationDisplayNameDefaultTransformer({
        ruleId: 'eslint-comments/no-use',
      });

      expect(result).toBe('Code Quality Rule Bypass');
    });
  });

  describe('unknown rules', () => {
    it('VALID: {ruleId: "unknown-rule"} => returns "Code Quality Issue"', () => {
      const result = violationDisplayNameDefaultTransformer({ ruleId: 'unknown-rule' });

      expect(result).toBe('Code Quality Issue');
    });

    it('VALID: {ruleId: "prefer-const"} => returns "Code Quality Issue"', () => {
      const result = violationDisplayNameDefaultTransformer({ ruleId: 'prefer-const' });

      expect(result).toBe('Code Quality Issue');
    });

    it('VALID: {ruleId: "no-console"} => returns "Code Quality Issue"', () => {
      const result = violationDisplayNameDefaultTransformer({ ruleId: 'no-console' });

      expect(result).toBe('Code Quality Issue');
    });

    it('VALID: {ruleId: "custom-rule-123"} => returns "Code Quality Issue"', () => {
      const result = violationDisplayNameDefaultTransformer({ ruleId: 'custom-rule-123' });

      expect(result).toBe('Code Quality Issue');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {ruleId: ""} => returns "Code Quality Issue"', () => {
      const result = violationDisplayNameDefaultTransformer({ ruleId: '' });

      expect(result).toBe('Code Quality Issue');
    });

    it('EDGE: {ruleId: "   "} => returns "Code Quality Issue"', () => {
      const result = violationDisplayNameDefaultTransformer({ ruleId: '   ' });

      expect(result).toBe('Code Quality Issue');
    });

    it('EDGE: {ruleId: "@typescript-eslint/NO-EXPLICIT-ANY"} => returns "Code Quality Issue" (case sensitive)', () => {
      const result = violationDisplayNameDefaultTransformer({
        ruleId: '@typescript-eslint/NO-EXPLICIT-ANY',
      });

      expect(result).toBe('Code Quality Issue');
    });
  });
});
