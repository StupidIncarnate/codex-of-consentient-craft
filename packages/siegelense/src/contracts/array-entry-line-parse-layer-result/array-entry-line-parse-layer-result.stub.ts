/**
 * PURPOSE: Builds a valid ArrayEntryLineParseLayerResult for tests
 *
 * USAGE:
 * ArrayEntryLineParseLayerResultStub();
 * // Returns a valid ArrayEntryLineParseLayerResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { arrayEntryLineParseLayerResultContract } from './array-entry-line-parse-layer-result-contract';
import type { ArrayEntryLineParseLayerResult } from './array-entry-line-parse-layer-result-contract';

export const ArrayEntryLineParseLayerResultStub = ({
  ...props
}: StubArgument<ArrayEntryLineParseLayerResult> = {}): ArrayEntryLineParseLayerResult =>
  arrayEntryLineParseLayerResultContract.parse({ entries: [], ...props });
