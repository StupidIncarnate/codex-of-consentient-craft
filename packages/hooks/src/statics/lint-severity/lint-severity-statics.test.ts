import { lintSeverityStatics } from './lint-severity-statics';

describe('lintSeverityStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(lintSeverityStatics).toStrictEqual({
      warning: 1,
      error: 2,
    });
  });
});
