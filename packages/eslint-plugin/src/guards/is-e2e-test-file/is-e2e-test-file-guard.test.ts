import { filePathContract } from '../../contracts/file-path/file-path-contract';
import { isE2eTestFileGuard } from './is-e2e-test-file-guard';

describe('isE2eTestFileGuard', () => {
  it('VALID: {filePath: "/src/user.e2e.test.ts"} => returns true', () => {
    const filePath = filePathContract.parse('/src/user.e2e.test.ts');

    const result = isE2eTestFileGuard({ filePath });

    expect(result).toBe(true);
  });

  it('VALID: {filePath: "/src/user.e2e.spec.ts"} => returns true', () => {
    const filePath = filePathContract.parse('/src/user.e2e.spec.ts');

    const result = isE2eTestFileGuard({ filePath });

    expect(result).toBe(true);
  });

  it('VALID: {filePath: "/tests/e2e/user.e2e.test.ts"} => returns true', () => {
    const filePath = filePathContract.parse('/tests/e2e/user.e2e.test.ts');

    const result = isE2eTestFileGuard({ filePath });

    expect(result).toBe(true);
  });

  it('VALID: {filePath: "/src/user.test.ts"} => returns false', () => {
    const filePath = filePathContract.parse('/src/user.test.ts');

    const result = isE2eTestFileGuard({ filePath });

    expect(result).toBe(false);
  });

  it('VALID: {filePath: "/src/user.spec.ts"} => returns false', () => {
    const filePath = filePathContract.parse('/src/user.spec.ts');

    const result = isE2eTestFileGuard({ filePath });

    expect(result).toBe(false);
  });

  it('VALID: {filePath: "/src/user.integration.test.ts"} => returns false', () => {
    const filePath = filePathContract.parse('/src/user.integration.test.ts');

    const result = isE2eTestFileGuard({ filePath });

    expect(result).toBe(false);
  });

  it('VALID: {filePath: "/src/user.ts"} => returns false', () => {
    const filePath = filePathContract.parse('/src/user.ts');

    const result = isE2eTestFileGuard({ filePath });

    expect(result).toBe(false);
  });
});
