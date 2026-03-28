import { eslintSeverityStatics } from './eslint-severity-statics';

describe('eslintSeverityStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(eslintSeverityStatics).toStrictEqual({
      1: 'warning',
      2: 'error',
    });
  });
});
