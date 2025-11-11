import { violationsFindNewTransformer } from './violations-find-new-transformer';
import { ViolationCountStub } from '../../contracts/violation-count/violation-count.stub';

type ViolationCount = ReturnType<typeof ViolationCountStub>;

describe('violationsFindNewTransformer', () => {
  describe('success cases', () => {
    it('VALID: {oldViolations: [], newViolations: []} => returns no new violations', () => {
      const oldViolations: ViolationCount[] = [];
      const newViolations: ViolationCount[] = [];

      const result = violationsFindNewTransformer({ oldViolations, newViolations });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {oldViolations: [1 any], newViolations: [same 1 any]} => returns no new violations', () => {
      const oldViolations: ViolationCount[] = [
        ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
      ];

      const newViolations: ViolationCount[] = [
        ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
      ];

      const result = violationsFindNewTransformer({ oldViolations, newViolations });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {oldViolations: [2 any], newViolations: [1 any]} => returns no new violations (removing violations)', () => {
      const oldViolations: ViolationCount[] = [
        ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 2 }),
      ];

      const newViolations: ViolationCount[] = [
        ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
      ];

      const result = violationsFindNewTransformer({ oldViolations, newViolations });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {oldViolations: [mixed], newViolations: [same counts]} => returns no new violations', () => {
      const oldViolations: ViolationCount[] = [
        ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 2 }),
        ViolationCountStub({ ruleId: '@typescript-eslint/ban-ts-comment', count: 1 }),
      ];

      const newViolations: ViolationCount[] = [
        ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 2 }),
        ViolationCountStub({ ruleId: '@typescript-eslint/ban-ts-comment', count: 1 }),
      ];

      const result = violationsFindNewTransformer({ oldViolations, newViolations });

      expect(result).toStrictEqual([]);
    });
  });

  describe('failure cases', () => {
    it('INVALID: {oldViolations: [], newViolations: [1 any]} => returns new violations', () => {
      const oldViolations: ViolationCount[] = [];

      const newViolations: ViolationCount[] = [
        ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
      ];

      const result = violationsFindNewTransformer({ oldViolations, newViolations });

      expect(result).toStrictEqual([
        ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
      ]);
    });

    it('INVALID: {oldViolations: [1 any], newViolations: [2 any]} => returns 1 new violation', () => {
      const oldViolations: ViolationCount[] = [
        ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
      ];

      const newViolations: ViolationCount[] = [
        ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 2 }),
      ];

      const result = violationsFindNewTransformer({ oldViolations, newViolations });

      expect(result).toStrictEqual([
        ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
      ]);
    });

    it('INVALID: {oldViolations: [1 any], newViolations: [1 ts-ignore]} => returns new violations (different rule)', () => {
      const oldViolations: ViolationCount[] = [
        ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
      ];

      const newViolations: ViolationCount[] = [
        ViolationCountStub({ ruleId: '@typescript-eslint/ban-ts-comment', count: 1 }),
      ];

      const result = violationsFindNewTransformer({ oldViolations, newViolations });

      expect(result).toStrictEqual([
        ViolationCountStub({ ruleId: '@typescript-eslint/ban-ts-comment', count: 1 }),
      ]);
    });

    it('INVALID: {oldViolations: [], newViolations: [multiple violations]} => returns all as new violations', () => {
      const oldViolations: ViolationCount[] = [];

      const newViolations: ViolationCount[] = [
        ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 2 }),
        ViolationCountStub({ ruleId: '@typescript-eslint/ban-ts-comment', count: 1 }),
        ViolationCountStub({ ruleId: 'eslint-comments/no-use', count: 1 }),
      ];

      const result = violationsFindNewTransformer({ oldViolations, newViolations });

      expect(result).toStrictEqual([
        ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 2 }),
        ViolationCountStub({ ruleId: '@typescript-eslint/ban-ts-comment', count: 1 }),
        ViolationCountStub({ ruleId: 'eslint-comments/no-use', count: 1 }),
      ]);
    });

    it('COMPLEX: {oldViolations: [mixed], newViolations: [some removed, some added]} => returns only new violations', () => {
      const oldViolations: ViolationCount[] = [
        ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
        ViolationCountStub({ ruleId: '@typescript-eslint/ban-ts-comment', count: 2 }),
      ];

      const newViolations: ViolationCount[] = [
        ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 3 }), // +2 new
        ViolationCountStub({ ruleId: '@typescript-eslint/ban-ts-comment', count: 1 }), // -1 (removed, no new)
        ViolationCountStub({ ruleId: 'eslint-comments/no-use', count: 1 }), // +1 new rule
      ];

      const result = violationsFindNewTransformer({ oldViolations, newViolations });

      expect(result).toStrictEqual([
        ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 2 }),
        ViolationCountStub({ ruleId: 'eslint-comments/no-use', count: 1 }),
      ]);
    });
  });
});
