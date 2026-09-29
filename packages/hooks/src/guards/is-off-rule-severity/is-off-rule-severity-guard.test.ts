import { isOffRuleSeverityGuard } from './is-off-rule-severity-guard';

describe('isOffRuleSeverityGuard', () => {
  it.each(['off', 0, ['off'], [0, { a: 1 }], ['off', { a: 1 }]])(
    'VALID: {ruleValue: %j} => returns true',
    (ruleValue) => {
      expect(isOffRuleSeverityGuard({ ruleValue })).toBe(true);
    },
  );

  it.each(['error', 'warn', 1, 2, ['error', { a: 1 }], ['warn'], []])(
    'VALID: {ruleValue: %j} => returns false',
    (ruleValue) => {
      expect(isOffRuleSeverityGuard({ ruleValue })).toBe(false);
    },
  );

  it('EMPTY: {ruleValue: undefined} => returns false', () => {
    expect(isOffRuleSeverityGuard({})).toBe(false);
  });
});
