/**
 * PURPOSE: Generates a unique run ID from current timestamp and random hex suffix
 *
 * USAGE:
 * const runId = runIdGenerateTransformer();
 * // Returns RunId like '1739625600000-a3f1'
 */

import { runIdContract, type RunId } from '../../contracts/run-id/run-id-contract';
import { hexFormatStatics } from '../../statics/hex-format/hex-format-statics';

export const runIdGenerateTransformer = (): RunId => {
  const timestamp = Date.now();
  const hex = Math.random()
    .toString(hexFormatStatics.radix)
    .slice(hexFormatStatics.sliceStart, hexFormatStatics.sliceEnd);

  return runIdContract.parse(`${timestamp}-${hex}`);
};
