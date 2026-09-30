/**
 * PURPOSE: Builds a valid ImportsInFolderTypeFindLayerResult for tests
 *
 * USAGE:
 * ImportsInFolderTypeFindLayerResultStub();
 * // Returns a valid ImportsInFolderTypeFindLayerResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { importsInFolderTypeFindLayerResultContract } from './imports-in-folder-type-find-layer-result-contract';
import type { ImportsInFolderTypeFindLayerResult } from './imports-in-folder-type-find-layer-result-contract';

export const ImportsInFolderTypeFindLayerResultStub = ({
  ...props
}: StubArgument<ImportsInFolderTypeFindLayerResult> = {}): ImportsInFolderTypeFindLayerResult =>
  importsInFolderTypeFindLayerResultContract.parse({ entries: [], layers: [], ...props });
