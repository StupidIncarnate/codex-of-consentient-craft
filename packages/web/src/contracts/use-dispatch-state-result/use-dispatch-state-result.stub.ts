/**
 * PURPOSE: Builds a valid UseDispatchStateResult for tests
 *
 * USAGE:
 * UseDispatchStateResultStub();
 * // Returns a valid UseDispatchStateResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';

import { useDispatchStateResultContract } from './use-dispatch-state-result-contract';
import type { UseDispatchStateResult } from './use-dispatch-state-result-contract';

export const UseDispatchStateResultStub = ({
  ...props
}: StubArgument<UseDispatchStateResult> = {}): UseDispatchStateResult =>
  useDispatchStateResultContract.parse({ state: DispatchStateStub(), isLoading: false, ...props });
