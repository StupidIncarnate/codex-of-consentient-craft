/**
 * PURPOSE: Polls one of `BrowserSession`'s two continuous buffers — console or network — for a line
 * matching the caller's own predicate, from `fromIndex` onward. `stepUntilBroker` passes the RUN's
 * own window start here, never the step's own — so a line that arrived during an earlier STEP of
 * this same run is already inside `fromIndex` and resolves like any other match. Recursion, not
 * `while (true)`, mirroring `laneReadyWaitBroker`'s own poll shape. At the ceiling it also checks
 * whether a match exists EARLIER than `fromIndex`: once the window is the run's, a match sitting
 * there can only have arrived before this run's own window began — an EARLIER RUN, never an earlier
 * step of this one — and `UntilCeilingHitError`'s `bufferNote` is where that gets named instead of
 * leaving a bare timeout a walker re-runs unchanged.
 *
 * USAGE:
 * await untilBufferMatchLayerBroker({
 *   kind: 'network', readSince: session.readNetworkSince, fromIndex: 4, startedAtMs: Date.now(),
 *   deadlineAtMs: Date.now() + 15000, timeoutMs: 15000,
 *   matches: (parsed) => parsed.method === 'POST',
 *   descriptor: 'response POST /api/quests',
 *   buildReading: ({ parsed, waitedMs }) =>
 *     contentTextContract.parse(`POST /api/quests answered ${String(parsed.status)} after ${String(waitedMs)}ms`),
 * });
 * // Resolves the reading once a line matches, or throws UntilCeilingHitError at the ceiling
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';

import { UntilCeilingHitError } from '../../../errors/until-ceiling-hit/until-ceiling-hit-error';
import { driverStatics } from '../../../statics/driver/driver-statics';

export const untilBufferMatchLayerBroker = async ({
  kind,
  readSince,
  fromIndex,
  startedAtMs,
  deadlineAtMs,
  timeoutMs,
  matches,
  descriptor,
  buildReading,
}: {
  kind: 'console' | 'network';
  readSince: (params: { fromIndex: number }) => readonly ContentText[];
  fromIndex: number;
  startedAtMs: number;
  deadlineAtMs: number;
  timeoutMs: number;
  matches: (parsed: Record<PropertyKey, unknown>) => boolean;
  descriptor: string;
  buildReading: (params: { parsed: Record<PropertyKey, unknown>; waitedMs: number }) => ContentText;
}): Promise<ContentText> => {
  const sinceLines = readSince({ fromIndex });
  const matchedLine = sinceLines.find((line) =>
    matches(JSON.parse(line) as Record<PropertyKey, unknown>),
  );

  if (matchedLine !== undefined) {
    const waitedMs = Date.now() - startedAtMs;
    const parsed = JSON.parse(matchedLine) as Record<PropertyKey, unknown>;
    return buildReading({ parsed, waitedMs });
  }

  if (Date.now() < deadlineAtMs) {
    await new Promise((resolve) => {
      setTimeout(resolve, driverStatics.run.untilPollMs);
    });
    return untilBufferMatchLayerBroker({
      kind,
      readSince,
      fromIndex,
      startedAtMs,
      deadlineAtMs,
      timeoutMs,
      matches,
      descriptor,
      buildReading,
    });
  }

  // The ceiling is hit and nothing since `fromIndex` — the RUN's own window start — matched.
  // `fromIndex: 0` reads the WHOLE buffer so the portion before the window can be checked for the
  // one mistake this form invites now: a match that arrived before this RUN began.
  const wholeBuffer = readSince({ fromIndex: 0 });
  const earlier = wholeBuffer.slice(0, fromIndex);
  let earlierMatchIndex = -1;
  earlier.forEach((line, index) => {
    if (matches(JSON.parse(line) as Record<PropertyKey, unknown>)) {
      earlierMatchIndex = index;
    }
  });

  const sinceCount = sinceLines.length;
  const bufferNoteBase = `0 of ${String(sinceCount)} ${kind} lines since this step began matched.`;
  const linesBefore = earlier.length - earlierMatchIndex;
  const bufferNote =
    earlierMatchIndex === -1
      ? bufferNoteBase
      : `${bufferNoteBase} A match DID arrive earlier in this instance's buffer, ${String(
          linesBefore,
        )} line${linesBefore === 1 ? '' : 's'} before this run's own window began — it belongs to an earlier run, not this one: read it back with \`results --kind ${kind} --since boot\`.`;

  throw new UntilCeilingHitError({ descriptor, timeoutMs, bufferNote });
};
