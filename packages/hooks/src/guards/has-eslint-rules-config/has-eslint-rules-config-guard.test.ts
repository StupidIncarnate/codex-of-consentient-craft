import { hasEslintRulesConfigGuard } from './has-eslint-rules-config-guard';

describe('hasEslintRulesConfigGuard', () => {
  it('VALID: config with rules => returns true', () => {
    const result = hasEslintRulesConfigGuard({
      config: { rules: { 'no-console': 'error' } },
    });

    expect(result).toBe(true);
  });

  it('VALID: config with multiple rules => returns true', () => {
    const result = hasEslintRulesConfigGuard({
      config: { rules: { 'no-console': 'error', 'no-debugger': 'warn' } },
    });

    expect(result).toBe(true);
  });

  it('INVALID: config with empty rules => returns false', () => {
    const result = hasEslintRulesConfigGuard({
      config: { rules: {} },
    });

    expect(result).toBe(false);
  });

  it('INVALID: config without rules property => returns false', () => {
    const result = hasEslintRulesConfigGuard({
      config: { plugins: {} },
    });

    expect(result).toBe(false);
  });

  it('INVALID: config is null => returns false', () => {
    const result = hasEslintRulesConfigGuard({ config: null });

    expect(result).toBe(false);
  });

  it('INVALID: config is undefined => returns false', () => {
    const result = hasEslintRulesConfigGuard({});

    expect(result).toBe(false);
  });

  it('INVALID: config is a string => returns false', () => {
    const result = hasEslintRulesConfigGuard({ config: 'not-an-object' });

    expect(result).toBe(false);
  });

  it('INVALID: config rules is a string => returns false', () => {
    const result = hasEslintRulesConfigGuard({ config: { rules: 'not-an-object' } });

    expect(result).toBe(false);
  });

  it('INVALID: config rules is null => returns false', () => {
    const result = hasEslintRulesConfigGuard({ config: { rules: null } });

    expect(result).toBe(false);
  });
});
