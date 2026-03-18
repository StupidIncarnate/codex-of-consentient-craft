import { isIntegrationTestPathGuard } from './is-integration-test-path-guard';

describe('isIntegrationTestPathGuard', () => {
  it('VALID: {filePath: "src/foo.integration.test.ts"} => returns true for integration test', () => {
    expect(isIntegrationTestPathGuard({ filePath: 'src/foo.integration.test.ts' })).toBe(true);
  });

  it('VALID: {filePath: "src/foo.test.ts"} => returns false for unit test', () => {
    expect(isIntegrationTestPathGuard({ filePath: 'src/foo.test.ts' })).toBe(false);
  });

  it('VALID: {filePath: "src/foo.e2e.test.ts"} => returns false for e2e test', () => {
    expect(isIntegrationTestPathGuard({ filePath: 'src/foo.e2e.test.ts' })).toBe(false);
  });

  it('VALID: {filePath: "src/foo.ts"} => returns false for non-test file', () => {
    expect(isIntegrationTestPathGuard({ filePath: 'src/foo.ts' })).toBe(false);
  });

  it('EDGE: {filePath: undefined} => returns false', () => {
    expect(isIntegrationTestPathGuard({})).toBe(false);
  });
});
