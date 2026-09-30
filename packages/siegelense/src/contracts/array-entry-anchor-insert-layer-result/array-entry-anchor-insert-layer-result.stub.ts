/**
 * PURPOSE: Builds a valid ArrayEntryAnchorInsertLayerResult for tests
 *
 * USAGE:
 * ArrayEntryAnchorInsertLayerResultStub();
 * // Returns a valid ArrayEntryAnchorInsertLayerResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { arrayEntryAnchorInsertLayerResultContract } from './array-entry-anchor-insert-layer-result-contract';
import type { ArrayEntryAnchorInsertLayerResult } from './array-entry-anchor-insert-layer-result-contract';

export const ArrayEntryAnchorInsertLayerResultStub = ({
  ...props
}: StubArgument<ArrayEntryAnchorInsertLayerResult> = {}): ArrayEntryAnchorInsertLayerResult =>
  arrayEntryAnchorInsertLayerResultContract.parse({
    content: 'sample',
    inserted: false,
    alreadyPresent: false,
    matchedEntryValue: 'sample',
    ...props,
  });
