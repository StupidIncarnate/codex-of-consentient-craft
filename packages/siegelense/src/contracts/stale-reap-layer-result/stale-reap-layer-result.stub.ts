/**
 * PURPOSE: Builds a valid StaleReapLayerResult for tests
 *
 * USAGE:
 * StaleReapLayerResultStub();
 * // Returns a valid StaleReapLayerResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ReapedInstanceStub } from '../reaped-instance/reaped-instance.stub';

import { staleReapLayerResultContract } from './stale-reap-layer-result-contract';
import type { StaleReapLayerResult } from './stale-reap-layer-result-contract';

export const StaleReapLayerResultStub = ({
  ...props
}: StubArgument<StaleReapLayerResult> = {}): StaleReapLayerResult =>
  staleReapLayerResultContract.parse({ reaped: ReapedInstanceStub(), portsReleased: [], ...props });
