/**
 * PURPOSE: Parses `runs/run_N.jsonl` into the `StepReading[]` it holds, skipping a truncated final
 * line rather than throwing — a crashed driver leaves exactly that, and everything up to the last
 * flushed step is still queryable (siegelense-tooling.md line 1206: "A death at step 7 of run 2
 * does not lose runs 1 and 2"). A missing transcript (an unstarted or unknown run) answers `[]`
 * rather than throwing — `resultsReadBroker` is the layer that decides whether an absent run is an
 * error or an empty answer.
 *
 * USAGE:
 * await transcriptReadLayerBroker({
 *   transcriptPath: AbsoluteFilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets/.../runs/run_2.jsonl' }),
 * });
 * // Returns every StepReading the transcript holds, dropping only a truncated final line
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapter } from '../../../adapters/error/is-native-error/error-is-native-error-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { stepReadingContract } from '../../../contracts/step-reading/step-reading-contract';
import type { StepReading } from '../../../contracts/step-reading/step-reading-contract';

export const transcriptReadLayerBroker = async ({
  transcriptPath,
}: {
  transcriptPath: AbsoluteFilePath;
}): Promise<readonly StepReading[]> => {
  const content = await fsReadFileAdapter({ filePath: transcriptPath }).catch((error: unknown) => {
    if (
      error !== null &&
      typeof error === 'object' &&
      errorIsNativeErrorAdapter({ value: error }) &&
      'cause' in error &&
      error.cause !== null &&
      typeof error.cause === 'object' &&
      errorIsNativeErrorAdapter({ value: error.cause }) &&
      'code' in error.cause &&
      error.cause.code === 'ENOENT'
    ) {
      return null;
    }
    throw error;
  });

  if (content === null) {
    return [];
  }

  const lines = content.split('\n').filter((line) => line.length > 0);

  return lines.reduce<StepReading[]>((accumulated, line) => {
    try {
      accumulated.push(stepReadingContract.parse(JSON.parse(line)));
    } catch {
      // A truncated final line is the one shape a crashed driver can leave mid-append — every
      // earlier, complete line still answers rather than losing the whole transcript to one bad
      // tail.
    }
    return accumulated;
  }, []);
};
