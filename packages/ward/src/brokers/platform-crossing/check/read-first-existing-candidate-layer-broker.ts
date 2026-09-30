/**
 * PURPOSE: Tries each candidate file path in order and returns the first one that reads
 * successfully, mirroring node10 resolution's own "try `.ts`, then `.tsx`, then `index.ts`" order.
 * Recursion rather than a loop: `no-await-in-loop` (error, repo-wide) forbids the loop-statement
 * form of this same short-circuiting sequential read, and each candidate genuinely depends on the
 * previous one having failed.
 *
 * USAGE:
 * await readFirstExistingCandidateLayerBroker({ candidates: ['/repo/x.ts'] });
 * // Returns: { filePath: '/repo/x.ts', content: '...' } or undefined when every candidate is absent
 */

import { readFirstExistingCandidateLayerResultContract } from '../../../contracts/read-first-existing-candidate-layer-result/read-first-existing-candidate-layer-result-contract';
import type { ReadFirstExistingCandidateLayerResult } from '../../../contracts/read-first-existing-candidate-layer-result/read-first-existing-candidate-layer-result-contract';
import { readFile } from '#gateway/node/fs__promises';

import { isNodeErrorWithCodeGuard } from '../../../guards/is-node-error-with-code/is-node-error-with-code-guard';

export const readFirstExistingCandidateLayerBroker = async ({
  candidates,
}: {
  candidates: readonly string[];
}): Promise<ReadFirstExistingCandidateLayerResult | undefined> => {
  const [firstCandidate, ...remainingCandidates] = candidates;
  if (firstCandidate === undefined) {
    return undefined;
  }

  const raw = await readFile(firstCandidate).catch((error: unknown) => {
    if (isNodeErrorWithCodeGuard({ error, code: 'ENOENT' })) {
      return undefined;
    }
    throw error;
  });
  if (raw !== undefined) {
    return readFirstExistingCandidateLayerResultContract.parse({
      filePath: firstCandidate,
      content: raw,
    });
  }

  return readFirstExistingCandidateLayerBroker({ candidates: remainingCandidates });
};
