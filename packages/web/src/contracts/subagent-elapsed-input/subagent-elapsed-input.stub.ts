import type { StubArgument } from '@dungeonmaster/shared/@types';

import { subagentElapsedInputContract } from './subagent-elapsed-input-contract';
import type { SubagentElapsedInput } from './subagent-elapsed-input-contract';

export const SubagentElapsedInputStub = ({
  ...props
}: StubArgument<SubagentElapsedInput> = {}): SubagentElapsedInput =>
  subagentElapsedInputContract.parse({
    startedAt: '2026-09-10T10:00:00.000Z',
    ...props,
  });
