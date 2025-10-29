import { testDirectoryPathContract } from './test-directory-path-contract';
import type { TestDirectoryPath } from './test-directory-path-contract';

export const TestDirectoryPathStub = (
  { value }: { value: string } = { value: '/tmp/test' },
): TestDirectoryPath => testDirectoryPathContract.parse(value);
