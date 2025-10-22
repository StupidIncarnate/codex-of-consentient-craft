import { hookConfigDefaultTransformer } from './hook-config-default-transformer';

describe('hookConfigDefaultTransformer', () => {
  it('VALID: {} => returns PreEditLintConfig with only pre-edit rules', () => {
    const result = hookConfigDefaultTransformer();

    // Verify it's a valid PreEditLintConfig
    expect(result.rules).toBeDefined();
    expect(Array.isArray(result.rules)).toBe(true);

    // Verify it contains expected pre-edit rules
    expect(result.rules).toContain('@typescript-eslint/no-explicit-any');
    expect(result.rules).toContain('@typescript-eslint/ban-ts-comment');
    expect(result.rules).toContain('eslint-comments/no-use');
    expect(result.rules).toContain('eslint-comments/no-unlimited-disable');
    expect(result.rules).toContain('@questmaestro/ban-primitives');
    expect(result.rules).toContain('@questmaestro/enforce-object-destructuring-params');
    expect(result.rules).toContain('@questmaestro/require-contract-validation');

    // Verify it does NOT contain post-edit rules
    expect(result.rules).not.toContain('@questmaestro/enforce-proxy-patterns');
    expect(result.rules).not.toContain('@questmaestro/enforce-implementation-colocation');
    expect(result.rules).not.toContain('@questmaestro/enforce-test-colocation');
  });

  it('VALID: {} => returns all 28 pre-edit rules from centralized mapping', () => {
    const result = hookConfigDefaultTransformer();

    // 9 third-party + 19 @questmaestro = 28 total pre-edit rules
    expect(result.rules).toHaveLength(28);
  });
});
