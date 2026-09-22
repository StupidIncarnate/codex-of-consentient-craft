/**
 * PURPOSE: Reads the committed driving-oddity file off disk — one `DrivingOddity` per line, in the
 * order a walk appended them. An ABSENT file is a real, empty answer: no walk has found or recorded
 * an oddity here yet, and that is not a defect. A PRESENT-but-unparseable line THROWS
 * `DrivingOddityFileMalformedError` instead, for the same reason `snapshotIndexReadBroker` refuses to
 * collapse "broken" into "empty" — a caller told there is nothing here silently loses a correction
 * some earlier walk already wrote, then measures against a state nobody intended. Takes the already-
 * resolved `filePath` rather than resolving it here: no `locationsStatics` entry for the committed
 * oddities file's directory exists yet (`.dungeonmaster-assets/` is T4-15a's), so composing it here
 * would mean either hardcoding the literal — the one thing every sibling resolver in
 * `brokers/locations/**` exists to avoid — or duplicating a value about to move.
 *
 * USAGE:
 * await drivingOddityReadBroker({
 *   filePath: AbsoluteFilePathStub({ value: '/repo/.dungeonmaster-assets/driving-oddities.jsonl' }),
 * });
 * // Returns every DrivingOddity in append order, or [] when the file does not exist yet
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import { drivingOddityContract } from '../../../contracts/driving-oddity/driving-oddity-contract';
import type { DrivingOddity } from '../../../contracts/driving-oddity/driving-oddity-contract';
import { DrivingOddityFileMalformedError } from '../../../errors/driving-oddity-file-malformed/driving-oddity-file-malformed-error';

export const drivingOddityReadBroker = async ({
  filePath,
}: {
  filePath: AbsoluteFilePath;
}): Promise<readonly DrivingOddity[]> => {
  const stat = await fsStatAdapter({ filePath });
  if (stat === null) {
    return [];
  }

  const contents = await fsReadFileAdapter({ filePath });
  const lines = contents.split('\n').filter((line) => line.trim().length > 0);

  return lines.map((line, index) => {
    try {
      return drivingOddityContract.parse(JSON.parse(line));
    } catch (error) {
      throw new DrivingOddityFileMalformedError({
        filePath,
        lineNumber: index + 1,
        line,
        cause: error,
      });
    }
  });
};
