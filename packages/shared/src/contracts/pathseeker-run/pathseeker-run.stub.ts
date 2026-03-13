import type { StubArgument } from '@dungeonmaster/shared/@types';

import { pathseekerRunContract } from './pathseeker-run-contract';
import type { PathseekerRun } from './pathseeker-run-contract';

export const PathseekerRunStub = ({ ...props }: StubArgument<PathseekerRun> = {}): PathseekerRun =>
  pathseekerRunContract.parse({
    attempt: 0,
    startedAt: '2024-01-15T10:00:00.000Z',
    status: 'in_progress',
    ...props,
  });
