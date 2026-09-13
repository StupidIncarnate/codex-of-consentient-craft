/**
 * PURPOSE: Turns a `SubagentElapsedInput` into the duration figure a sub-agent chain header
 * shows, applying one fixed precedence: the CLI's own `reportedDurationMs` beats the
 * notification's `endedAt` gap, which beats the panel's live `clockReading`, which beats
 * showing nothing. Reach for this over calling `elapsedPartsTransformer` /
 * `durationDisplayTransformer` directly wherever a chain's duration needs to be picked FROM
 * several candidate measurements rather than one already-decided end point.
 *
 * USAGE:
 * subagentDurationLabelTransformer({ input: SubagentElapsedInputStub({ clockReading: now }) });
 * // Returns a branded DisplayLabel built from whichever candidate wins precedence, or null
 * // when the input carries no end point at all
 */

import { isoTimestampContract } from '../../contracts/iso-timestamp/iso-timestamp-contract';
import type { IsoTimestamp } from '../../contracts/iso-timestamp/iso-timestamp-contract';
import type { SubagentElapsedInput } from '../../contracts/subagent-elapsed-input/subagent-elapsed-input-contract';
import type { DisplayLabel } from '../../contracts/display-label/display-label-contract';
import { elapsedPartsTransformer } from '../elapsed-parts/elapsed-parts-transformer';
import { durationDisplayTransformer } from '../duration-display/duration-display-transformer';

export const subagentDurationLabelTransformer = ({
  input,
}: {
  input: SubagentElapsedInput;
}): DisplayLabel | null => {
  const startedAtMs = new Date(String(input.startedAt)).getTime();

  const endPoint: IsoTimestamp | undefined =
    input.reportedDurationMs === undefined
      ? (input.endedAt ?? input.clockReading)
      : isoTimestampContract.parse(
          new Date(startedAtMs + Number(input.reportedDurationMs)).toISOString(),
        );

  if (endPoint === undefined) return null;

  return durationDisplayTransformer({
    elapsedParts: elapsedPartsTransformer({ startedAt: input.startedAt, endedAt: endPoint }),
  });
};
