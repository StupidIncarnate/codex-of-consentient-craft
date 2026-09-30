/**
 * PURPOSE: Generates a unique run ID from current timestamp and random hex suffix
 *
 * USAGE:
 * const runId = runIdGenerateTransformer();
 * // Returns RunId like '1739625600000-a3f1'
 */

import { hexFormatStatics } from '../../statics/hex-format/hex-format-statics';
import type { WardRunResult } from '../../contracts/ward-result/ward-result-contract';
import { wardRunResultContract } from '../../contracts/ward-result/ward-result-contract';

export const runIdGenerateTransformer = (): WardRunResult['runId'] => {
  const timestamp = Date.now();
  const hex = Math.random()
    .toString(hexFormatStatics.radix)
    .slice(hexFormatStatics.sliceStart, hexFormatStatics.sliceEnd);

  return wardRunResultContract.shape.runId.parse(`${timestamp}-${hex}`);
};
