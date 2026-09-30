/**
 * PURPOSE: Builds a valid UseElapsedTickResult for tests
 *
 * USAGE:
 * UseElapsedTickResultStub();
 * // Returns a valid UseElapsedTickResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { useElapsedTickResultContract } from './use-elapsed-tick-result-contract';
import type { UseElapsedTickResult } from './use-elapsed-tick-result-contract';

export const UseElapsedTickResultStub = ({
  ...props
}: StubArgument<UseElapsedTickResult> = {}): UseElapsedTickResult =>
  useElapsedTickResultContract.parse({ now: 'sample', ...props });
