import { configDefaultsStatics } from './config-defaults-statics';

describe('configDefaultsStatics', () => {
  it('VALID: defaults.allowedRootFiles => contains expected files', () => {
    const { defaults } = configDefaultsStatics;

    expect(defaults.allowedRootFiles).toStrictEqual(['global.d.ts']);
  });

  it('VALID: defaults.booleanFunctionPrefixes => contains expected prefixes', () => {
    const { defaults } = configDefaultsStatics;

    expect(defaults.booleanFunctionPrefixes).toStrictEqual([
      'is',
      'has',
      'can',
      'should',
      'will',
      'was',
    ]);
  });

  it('VALID: defaults => is readonly', () => {
    const { defaults } = configDefaultsStatics;

    expect(Object.isFrozen(defaults.allowedRootFiles)).toBe(true);
    expect(Object.isFrozen(defaults.booleanFunctionPrefixes)).toBe(true);
  });
});
