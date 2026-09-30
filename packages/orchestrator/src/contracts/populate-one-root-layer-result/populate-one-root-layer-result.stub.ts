/**
 * PURPOSE: Builds a valid PopulateOneRootLayerResult for tests
 *
 * USAGE:
 * PopulateOneRootLayerResultStub();
 * // Returns a valid PopulateOneRootLayerResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { populateOneRootLayerResultContract } from './populate-one-root-layer-result-contract';
import type { PopulateOneRootLayerResult } from './populate-one-root-layer-result-contract';

export const PopulateOneRootLayerResultStub = ({
  ...props
}: StubArgument<PopulateOneRootLayerResult> = {}): PopulateOneRootLayerResult =>
  populateOneRootLayerResultContract.parse({ workspacePackageRoots: [], ...props });
