import { testProjectNameContract } from './test-project-name-contract';
import type { TestProjectName } from './test-project-name-contract';

export const TestProjectNameStub = (
  { value }: { value: string } = { value: 'test-project' },
): TestProjectName => testProjectNameContract.parse(value);
