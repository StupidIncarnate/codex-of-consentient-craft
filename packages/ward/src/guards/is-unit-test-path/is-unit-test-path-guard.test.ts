import { isUnitTestPathGuard } from './is-unit-test-path-guard';

describe('isUnitTestPathGuard', () => {
  it('VALID: {filePath: "src/foo.test.ts"} => returns true for unit test', () => {
    expect(isUnitTestPathGuard({ filePath: 'src/foo.test.ts' })).toBe(true);
  });

  it('VALID: {filePath: "src/foo.test.tsx"} => returns true for tsx unit test', () => {
    expect(isUnitTestPathGuard({ filePath: 'src/foo.test.tsx' })).toBe(true);
  });

  it('VALID: {filePath: "src/foo.integration.test.ts"} => returns false for integration test', () => {
    expect(isUnitTestPathGuard({ filePath: 'src/foo.integration.test.ts' })).toBe(false);
  });

  it('VALID: {filePath: "src/foo.integration.test.tsx"} => returns false for tsx integration test', () => {
    expect(isUnitTestPathGuard({ filePath: 'src/foo.integration.test.tsx' })).toBe(false);
  });

  it('VALID: {filePath: "src/foo.integration.test.js"} => returns false for js integration test', () => {
    expect(isUnitTestPathGuard({ filePath: 'src/foo.integration.test.js' })).toBe(false);
  });

  it('VALID: {filePath: "src/foo.integration.test.jsx"} => returns false for jsx integration test', () => {
    expect(isUnitTestPathGuard({ filePath: 'src/foo.integration.test.jsx' })).toBe(false);
  });

  it('VALID: {filePath: "src/foo.e2e.test.ts"} => returns false for e2e test', () => {
    expect(isUnitTestPathGuard({ filePath: 'src/foo.e2e.test.ts' })).toBe(false);
  });

  it('VALID: {filePath: "src/foo.e2e.test.tsx"} => returns false for tsx e2e test', () => {
    expect(isUnitTestPathGuard({ filePath: 'src/foo.e2e.test.tsx' })).toBe(false);
  });

  it('VALID: {filePath: "src/foo.e2e.test.js"} => returns false for js e2e test', () => {
    expect(isUnitTestPathGuard({ filePath: 'src/foo.e2e.test.js' })).toBe(false);
  });

  it('VALID: {filePath: "src/foo.e2e.test.jsx"} => returns false for jsx e2e test', () => {
    expect(isUnitTestPathGuard({ filePath: 'src/foo.e2e.test.jsx' })).toBe(false);
  });

  it('VALID: {filePath: "src/foo.ts"} => returns true for non-test file', () => {
    expect(isUnitTestPathGuard({ filePath: 'src/foo.ts' })).toBe(true);
  });

  it('EDGE: {filePath: undefined} => returns false', () => {
    expect(isUnitTestPathGuard({})).toBe(false);
  });
});
