/**
 * PURPOSE: Builds a valid OrchestrationDispatchResult for tests.
 *
 * USAGE:
 * OrchestrationDispatchResultStub();
 * // Returns { state: DispatchState }
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';
import { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';

import { orchestrationDispatchResultContract } from './orchestration-dispatch-result-contract';
import type { OrchestrationDispatchResult } from './orchestration-dispatch-result-contract';

export const OrchestrationDispatchResultStub = ({
  ...props
}: StubArgument<OrchestrationDispatchResult> = {}): OrchestrationDispatchResult =>
  orchestrationDispatchResultContract.parse({
    state: DispatchStateStub(),
    ...props,
  });
