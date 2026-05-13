import type { StubArgument } from '@dungeonmaster/shared/@types';

import { processActivityContract } from './process-activity-contract';
import type { ProcessActivity } from './process-activity-contract';

export const ProcessActivityStub = ({
  ...props
}: StubArgument<ProcessActivity> = {}): ProcessActivity =>
  processActivityContract.parse({
    lastActivityAt: new Date('2026-05-12T22:58:24.835Z'),
    ...props,
  });
