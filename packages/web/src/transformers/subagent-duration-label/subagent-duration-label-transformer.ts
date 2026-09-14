/**
 * PURPOSE: Turns a `SubagentElapsedInput` into the duration figure a sub-agent chain header
 * shows, applying one fixed precedence: either CLI-reported duration — the notification's
 * `reportedDurationMs` or the completion tool_result's `completionDurationMs` — beats the
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

  // The two REPORTED figures both win over any timestamp arithmetic, because each is the CLI's
  // own measurement of the run rather than of the lines describing it. They never both arrive:
  // `reportedDurationMs` comes from an async launch's notification, `completionDurationMs` from
  // a blocking call's own tool_result.
  const reportedMs = input.reportedDurationMs ?? input.completionDurationMs;

  const endPoint: IsoTimestamp | undefined =
    reportedMs === undefined
      ? (input.endedAt ?? input.clockReading)
      : isoTimestampContract.parse(new Date(startedAtMs + Number(reportedMs)).toISOString());

  if (endPoint === undefined) return null;

  return durationDisplayTransformer({
    elapsedParts: elapsedPartsTransformer({ startedAt: input.startedAt, endedAt: endPoint }),
  });
};
