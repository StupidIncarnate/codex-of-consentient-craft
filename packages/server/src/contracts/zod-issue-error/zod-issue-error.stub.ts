import type { StubArgument } from '@dungeonmaster/shared/@types';

import { zodIssueErrorContract } from './zod-issue-error-contract';
import type { ZodIssueError } from './zod-issue-error-contract';

export const ZodIssueErrorStub = ({ ...props }: StubArgument<ZodIssueError> = {}): ZodIssueError =>
  zodIssueErrorContract.parse({
    issues: [{ message: 'Something went wrong', path: [] }],
    ...props,
  });
