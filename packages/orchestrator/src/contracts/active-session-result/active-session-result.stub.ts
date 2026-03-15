import type { StubArgument } from '@dungeonmaster/shared/@types';

import { activeSessionResultContract } from './active-session-result-contract';
import type { ActiveSessionResult } from './active-session-result-contract';

export const ActiveSessionResultStub = ({
  ...props
}: StubArgument<ActiveSessionResult> = {}): ActiveSessionResult =>
  activeSessionResultContract.parse({
    ...props,
  });
