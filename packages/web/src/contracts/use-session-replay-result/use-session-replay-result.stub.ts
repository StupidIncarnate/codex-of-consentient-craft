/**
 * PURPOSE: Builds a valid UseSessionReplayResult for tests
 *
 * USAGE:
 * UseSessionReplayResultStub();
 * // Returns a valid UseSessionReplayResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { useSessionReplayResultContract } from './use-session-replay-result-contract';
import type { UseSessionReplayResult } from './use-session-replay-result-contract';

export const UseSessionReplayResultStub = ({
  ...props
}: StubArgument<UseSessionReplayResult> = {}): UseSessionReplayResult =>
  useSessionReplayResultContract.parse({
    entries: [],
    isLoading: false,
    sessionNotFound: false,
    ...props,
  });
