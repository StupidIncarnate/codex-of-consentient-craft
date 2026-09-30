/**
 * PURPOSE: Builds a valid ReadFirstExistingCandidateLayerResult for tests
 *
 * USAGE:
 * ReadFirstExistingCandidateLayerResultStub();
 * // Returns a valid ReadFirstExistingCandidateLayerResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { readFirstExistingCandidateLayerResultContract } from './read-first-existing-candidate-layer-result-contract';
import type { ReadFirstExistingCandidateLayerResult } from './read-first-existing-candidate-layer-result-contract';

export const ReadFirstExistingCandidateLayerResultStub = ({
  ...props
}: StubArgument<ReadFirstExistingCandidateLayerResult> = {}): ReadFirstExistingCandidateLayerResult =>
  readFirstExistingCandidateLayerResultContract.parse({
    filePath: 'sample',
    content: 'sample',
    ...props,
  });
