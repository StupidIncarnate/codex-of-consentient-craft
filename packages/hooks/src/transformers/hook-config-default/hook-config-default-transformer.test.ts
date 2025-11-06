import { hookConfigDefaultTransformer } from './hook-config-default-transformer';

describe('hookConfigDefaultTransformer', () => {
  it('VALID: {} => returns PreEditLintConfig with expected pre-edit rules', () => {
    const result = hookConfigDefaultTransformer();

    const expectedPreEditRules = [
      '@typescript-eslint/no-explicit-any',
      '@typescript-eslint/ban-ts-comment',
      'eslint-comments/no-use',
      'eslint-comments/no-unlimited-disable',
      '@questmaestro/ban-primitives',
      '@questmaestro/enforce-object-destructuring-params',
      '@questmaestro/require-contract-validation',
    ];

    const postEditRules = [
      '@questmaestro/enforce-proxy-patterns',
      '@questmaestro/enforce-implementation-colocation',
      '@questmaestro/enforce-test-colocation',
    ];

    expect(result.rules).toBeDefined();
    expect(Array.isArray(result.rules)).toStrictEqual(true);
    expectedPreEditRules.forEach((rule) => expect(result.rules).toContain(rule));
    postEditRules.forEach((rule) => expect(result.rules).not.toContain(rule));
  });

  it('VALID: {} => returns all pre-edit rules from centralized mapping', () => {
    const result = hookConfigDefaultTransformer();

    // Verify we have the expected number of pre-edit rules
    expect(result.rules.length).toBeGreaterThan(30);
  });
});
