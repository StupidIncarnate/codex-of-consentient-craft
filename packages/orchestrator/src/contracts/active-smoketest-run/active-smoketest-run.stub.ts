import type { StubArgument } from '@dungeonmaster/shared/@types';

import { activeSmoketestRunContract } from './active-smoketest-run-contract';
import type { ActiveSmoketestRun } from './active-smoketest-run-contract';

export const ActiveSmoketestRunStub = ({
  ...props
}: StubArgument<ActiveSmoketestRun> = {}): ActiveSmoketestRun =>
  activeSmoketestRunContract.parse({
    runId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    suite: 'mcp',
    startedAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });
