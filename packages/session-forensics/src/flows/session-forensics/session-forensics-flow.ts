/**
 * PURPOSE: Routes a raw CLI argv array to the digest command it names. `DigestRunResponder` expects
 * an already-validated command and target. This flow does that validation, so a caller holding only
 * `process.argv.slice(2)` can call it directly. Reach for this flow instead of calling the
 * responder directly whenever the caller starts from raw argv rather than an already-validated
 * command and target.
 *
 * `--minutes <n>` (read only by `buckets`) and `--floor-seconds <n>` (read only by `gaps`) are the
 * two optional flags argv may carry after the target. Each is parsed through its own contract, and
 * a present-but-invalid value (non-integer, zero, negative) falls back to the usage block the same
 * way an unrecognised command does — never silently ignored or silently defaulted.
 *
 * USAGE:
 * SessionForensicsFlow({ argv: ['summary', 'abc-123'] });
 * // Returns the rendered ContentText for the `summary` command. Returns a usage block when argv
 * // names no valid command, or omits the target.
 * SessionForensicsFlow({ argv: ['buckets', 'abc-123', '--minutes', '5'] });
 * // Returns the `buckets` render with a 5-minute window instead of the default 15
 */
import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

import { DigestRunResponder } from '../../responders/digest/run/digest-run-responder';
import { digestCommandContract } from '../../contracts/digest-command/digest-command-contract';
import { bucketMinutesContract } from '../../contracts/bucket-minutes/bucket-minutes-contract';
import { gapFloorSecondsContract } from '../../contracts/gap-floor-seconds/gap-floor-seconds-contract';

const MINUTES_FLAG = '--minutes';
const FLOOR_SECONDS_FLAG = '--floor-seconds';

const USAGE_BLOCK = contentTextContract.parse(
  [
    'usage: session-forensics <command> <target>',
    ...digestCommandContract.unwrap().options,
    'buckets --minutes <n>',
    'gaps --floor-seconds <n>',
  ].join('\n'),
);

export const SessionForensicsFlow = ({ argv }: { argv: readonly string[] }): ContentText => {
  const parsedCommand = digestCommandContract.safeParse(argv[0]);
  const [, target] = argv;

  if (!parsedCommand.success || target === undefined) {
    return USAGE_BLOCK;
  }

  const minutesIndex = argv.indexOf(MINUTES_FLAG);
  const minutesFlagValue = minutesIndex === -1 ? undefined : argv[minutesIndex + 1];
  const parsedMinutes =
    minutesFlagValue === undefined ? undefined : bucketMinutesContract.safeParse(minutesFlagValue);

  if (parsedMinutes !== undefined && !parsedMinutes.success) {
    return USAGE_BLOCK;
  }

  const floorSecondsIndex = argv.indexOf(FLOOR_SECONDS_FLAG);
  const floorSecondsFlagValue = floorSecondsIndex === -1 ? undefined : argv[floorSecondsIndex + 1];
  const parsedFloorSeconds =
    floorSecondsFlagValue === undefined
      ? undefined
      : gapFloorSecondsContract.safeParse(floorSecondsFlagValue);

  if (parsedFloorSeconds !== undefined && !parsedFloorSeconds.success) {
    return USAGE_BLOCK;
  }

  return DigestRunResponder({
    command: parsedCommand.data,
    target,
    ...(parsedMinutes?.success ? { bucketMinutes: parsedMinutes.data } : {}),
    ...(parsedFloorSeconds?.success ? { gapFloorSeconds: parsedFloorSeconds.data } : {}),
  });
};
