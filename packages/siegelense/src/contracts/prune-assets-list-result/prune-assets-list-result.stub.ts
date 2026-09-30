/**
 * PURPOSE: Builds a valid PruneAssetsListResult for tests
 *
 * USAGE:
 * PruneAssetsListResultStub();
 * // Returns a valid PruneAssetsListResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { pruneAssetsListResultContract } from './prune-assets-list-result-contract';
import type { PruneAssetsListResult } from './prune-assets-list-result-contract';

export const PruneAssetsListResultStub = ({
  ...props
}: StubArgument<PruneAssetsListResult> = {}): PruneAssetsListResult =>
  pruneAssetsListResultContract.parse({ assets: [], runIds: [], ...props });
