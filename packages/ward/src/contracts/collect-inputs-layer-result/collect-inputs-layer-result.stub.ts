/**
 * PURPOSE: Builds a valid CollectInputsLayerResult for tests
 *
 * USAGE:
 * CollectInputsLayerResultStub();
 * // Returns a valid CollectInputsLayerResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { collectInputsLayerResultContract } from './collect-inputs-layer-result-contract';
import type { CollectInputsLayerResult } from './collect-inputs-layer-result-contract';

export const CollectInputsLayerResultStub = ({
  ...props
}: StubArgument<CollectInputsLayerResult> = {}): CollectInputsLayerResult =>
  collectInputsLayerResultContract.parse({ repoRoot: 'sample', relativePaths: [], ...props });
