import { isNonIntegrationTestGuard } from './is-non-integration-test-guard';

describe('isNonIntegrationTestGuard', () => {
  it('VALID: {filePath: "src/foo.test.ts"} => returns true for unit test', () => {
    expect(isNonIntegrationTestGuard({ filePath: 'src/foo.test.ts' })).toBe(true);
  });

  it('VALID: {filePath: "src/foo.e2e.test.ts"} => returns true for e2e test', () => {
    expect(isNonIntegrationTestGuard({ filePath: 'src/foo.e2e.test.ts' })).toBe(true);
  });

  it('VALID: {filePath: "src/foo.integration.test.ts"} => returns false for integration test', () => {
    expect(isNonIntegrationTestGuard({ filePath: 'src/foo.integration.test.ts' })).toBe(false);
  });

  it('VALID: {filePath: "src/foo.ts"} => returns false for non-test file', () => {
    expect(isNonIntegrationTestGuard({ filePath: 'src/foo.ts' })).toBe(false);
  });

  it('VALID: {filePath: "src/index.ts"} => returns false for source file', () => {
    expect(isNonIntegrationTestGuard({ filePath: 'src/index.ts' })).toBe(false);
  });

  it('EDGE: {filePath: undefined} => returns false', () => {
    expect(isNonIntegrationTestGuard({})).toBe(false);
  });
});
