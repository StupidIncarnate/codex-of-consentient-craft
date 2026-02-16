import type { StubArgument } from '@dungeonmaster/shared/@types';
import { projectResultContract, type ProjectResult } from './project-result-contract';

export const ProjectResultStub = ({ ...props }: StubArgument<ProjectResult> = {}): ProjectResult =>
  projectResultContract.parse({
    projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
    status: 'pass',
    errors: [],
    testFailures: [],
    rawOutput: { stdout: '', stderr: '', exitCode: 0 },
    ...props,
  });
