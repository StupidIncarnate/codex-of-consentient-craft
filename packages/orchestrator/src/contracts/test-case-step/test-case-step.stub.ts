import type { StubArgument } from '@dungeonmaster/shared/@types';

import { testCaseStepContract } from './test-case-step-contract';
import type { TestCaseStep } from './test-case-step-contract';

export const TestCaseStepStub = ({ ...props }: StubArgument<TestCaseStep> = {}): TestCaseStep =>
  testCaseStepContract.parse({
    nodeId: 'login-page',
    nodeLabel: 'Login Page',
    nodeType: 'state',
    transition: null,
    assertions: [],
    ...props,
  });
