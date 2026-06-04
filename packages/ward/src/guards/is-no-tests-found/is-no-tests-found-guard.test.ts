import { isNoTestsFoundGuard } from './is-no-tests-found-guard';

describe('isNoTestsFoundGuard', () => {
  it('VALID: {output: jest no-tests banner} => returns true', () => {
    expect(
      isNoTestsFoundGuard({
        output:
          'No tests found, exiting with code 1\nRun with `--passWithNoTests` to exit with code 0\nPattern: testing.ts|\\.integration\\.test\\.(ts|tsx|js|jsx)$ - 0 matches',
      }),
    ).toBe(true);
  });

  it('VALID: {output: jest no-related-tests banner} => returns true', () => {
    expect(
      isNoTestsFoundGuard({
        output: 'No tests found related to files matching /repo/src/index.ts from 1 changed file.',
      }),
    ).toBe(true);
  });

  it('VALID: {output: banner preceded by other lines} => returns true', () => {
    expect(
      isNoTestsFoundGuard({
        output: 'jest startup noise\nNo tests found, exiting with code 1\n',
      }),
    ).toBe(true);
  });

  it('VALID: {output: passing jest json report} => returns false', () => {
    expect(
      isNoTestsFoundGuard({
        output: '{"testResults":[],"numTotalTestSuites":0,"success":true}',
      }),
    ).toBe(false);
  });

  it('VALID: {output: failing jest json report} => returns false', () => {
    expect(
      isNoTestsFoundGuard({
        output: '{"testResults":[{"name":"a.test.ts"}],"success":false}',
      }),
    ).toBe(false);
  });

  it('EMPTY: {output: ""} => returns false', () => {
    expect(isNoTestsFoundGuard({ output: '' })).toBe(false);
  });

  it('EDGE: {output: undefined} => returns false', () => {
    expect(isNoTestsFoundGuard({})).toBe(false);
  });
});
