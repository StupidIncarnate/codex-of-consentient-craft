/**
 * PURPOSE: Constants for rate-limit windows (5h / 7d Anthropic account quotas), plus the two
 *   numbers the dispatch guardrail reads: the usage that stops new dispatches, and how long the
 *   queue waits after the API itself refused a request with a 429.
 *
 * USAGE:
 * rateLimitStatics.percent.max
 * // Returns: 100 — used as the upper bound for usedPercentage validation
 */

export const rateLimitStatics = {
  percent: {
    min: 0,
    max: 100,
  },
  // How each window is named wherever a person reads it — the queue's hold banner and the
  // statusline cards alike, so the two never drift into calling the same window different things.
  windowLabels: {
    fiveHour: '5h',
    sevenDay: '7d',
  },
  hold: {
    // A dispatched agent burns several points over a long session, and the snapshot is only as
    // fresh as the user's last statusline render — so the gate fires with headroom rather than at
    // the wall.
    thresholdPercentage: 90,
    // A 429 says the window is already spent, and the refusal carries a usage figure for nothing:
    // only `resetsAt`, which for a seven-day window can be days out. Waiting a fixed half hour and
    // re-reading the snapshot is what lets a five-hour window that has since decayed resume.
    rejectedWaitMs: 1_800_000,
  },
} as const;
