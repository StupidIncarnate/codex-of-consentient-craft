import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { testFilePathToImplementationPathTransformer } from './test-file-path-to-implementation-path-transformer';

describe('testFilePathToImplementationPathTransformer', () => {
  it('VALID: {testFilePath: "/src/user.test.ts"} => returns "/src/user.ts"', () => {
    const testFilePath = FilePathStub({ value: '/src/user.test.ts' });

    const result = testFilePathToImplementationPathTransformer({ testFilePath });

    expect(result).toBe('/src/user.ts');
  });

  it('VALID: {testFilePath: "/src/user.spec.ts"} => returns "/src/user.ts"', () => {
    const testFilePath = FilePathStub({ value: '/src/user.spec.ts' });

    const result = testFilePathToImplementationPathTransformer({ testFilePath });

    expect(result).toBe('/src/user.ts');
  });

  it('VALID: {testFilePath: "/src/user.integration.test.ts"} => returns "/src/user.ts"', () => {
    const testFilePath = FilePathStub({ value: '/src/user.integration.test.ts' });

    const result = testFilePathToImplementationPathTransformer({ testFilePath });

    expect(result).toBe('/src/user.ts');
  });

  it('VALID: {testFilePath: "/src/user.integration.spec.ts"} => returns "/src/user.ts"', () => {
    const testFilePath = FilePathStub({ value: '/src/user.integration.spec.ts' });

    const result = testFilePathToImplementationPathTransformer({ testFilePath });

    expect(result).toBe('/src/user.ts');
  });

  it('VALID: {testFilePath: "/src/user.e2e.test.ts"} => returns "/src/user.ts"', () => {
    const testFilePath = FilePathStub({ value: '/src/user.e2e.test.ts' });

    const result = testFilePathToImplementationPathTransformer({ testFilePath });

    expect(result).toBe('/src/user.ts');
  });

  it('VALID: {testFilePath: "/src/user.e2e.spec.ts"} => returns "/src/user.ts"', () => {
    const testFilePath = FilePathStub({ value: '/src/user.e2e.spec.ts' });

    const result = testFilePathToImplementationPathTransformer({ testFilePath });

    expect(result).toBe('/src/user.ts');
  });

  it('VALID: {testFilePath: "/src/component.test.tsx"} => returns "/src/component.tsx"', () => {
    const testFilePath = FilePathStub({ value: '/src/component.test.tsx' });

    const result = testFilePathToImplementationPathTransformer({ testFilePath });

    expect(result).toBe('/src/component.tsx');
  });

  it('VALID: {testFilePath: "/src/brokers/user/fetch/user-fetch-broker.test.ts"} => returns "/src/brokers/user/fetch/user-fetch-broker.ts"', () => {
    const testFilePath = FilePathStub({
      value: '/src/brokers/user/fetch/user-fetch-broker.test.ts',
    });

    const result = testFilePathToImplementationPathTransformer({ testFilePath });

    expect(result).toBe('/src/brokers/user/fetch/user-fetch-broker.ts');
  });
});
