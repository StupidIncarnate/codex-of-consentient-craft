import type { StubArgument } from '@dungeonmaster/shared/@types';

import {
  reconcileWatchersResultContract,
  type ReconcileWatchersResult,
} from './reconcile-watchers-result-contract';

export const ReconcileWatchersResultStub = ({
  ...overrides
}: StubArgument<ReconcileWatchersResult> = {}): ReconcileWatchersResult =>
  reconcileWatchersResultContract.parse({
    started: 0,
    stopped: 0,
    ...overrides,
  });
