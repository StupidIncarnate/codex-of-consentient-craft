import { testFilePathToColocatedProxyPathTransformer } from './test-file-path-to-colocated-proxy-path-transformer';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('testFilePathToColocatedProxyPathTransformer', () => {
  it('VALID: {testFilePath: "/src/user-broker.test.ts"} => returns "./user-broker.proxy"', () => {
    const testFilePath = FilePathStub({ value: '/src/user-broker.test.ts' });

    const result = testFilePathToColocatedProxyPathTransformer({ testFilePath });

    expect(result).toBe('./user-broker.proxy');
  });

  it('VALID: {testFilePath: "/src/user-broker.test.tsx"} => returns "./user-broker.proxy"', () => {
    const testFilePath = FilePathStub({ value: '/src/user-broker.test.tsx' });

    const result = testFilePathToColocatedProxyPathTransformer({ testFilePath });

    expect(result).toBe('./user-broker.proxy');
  });

  it('VALID: {testFilePath: "/src/user-broker.spec.ts"} => returns "./user-broker.proxy"', () => {
    const testFilePath = FilePathStub({ value: '/src/user-broker.spec.ts' });

    const result = testFilePathToColocatedProxyPathTransformer({ testFilePath });

    expect(result).toBe('./user-broker.proxy');
  });

  it('VALID: {testFilePath: "/src/user-broker.integration.test.ts"} => returns "./user-broker.proxy"', () => {
    const testFilePath = FilePathStub({ value: '/src/user-broker.integration.test.ts' });

    const result = testFilePathToColocatedProxyPathTransformer({ testFilePath });

    expect(result).toBe('./user-broker.proxy');
  });

  it('VALID: {testFilePath: "/project/src/brokers/user/user-broker.test.ts"} => returns "./user-broker.proxy"', () => {
    const testFilePath = FilePathStub({ value: '/project/src/brokers/user/user-broker.test.ts' });

    const result = testFilePathToColocatedProxyPathTransformer({ testFilePath });

    expect(result).toBe('./user-broker.proxy');
  });
});
