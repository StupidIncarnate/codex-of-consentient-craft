/**
 * PURPOSE: The constants behind dungeonmaster's OWN usage measurement — how the four token counts
 *   on every assistant message combine into one comparable number, how long each quota window is,
 *   and how finely spend is bucketed. Reach for these rather than the statusline snapshot: the
 *   statusline reports percentages Anthropic computed, and it only reports them while the user
 *   happens to have a session open, so a queue running unattended has no reading at all.
 *
 * USAGE:
 * usageAccountingStatics.weights.cacheRead;
 * // Returns 0.1 — the multiplier that turns cache-read tokens into comparable units
 */

export const usageAccountingStatics = {
  // Anthropic does not publish the formula behind its rate-limit percentages, so these are the
  // published COST multipliers used as a proxy: whatever the real weighting is, spend that costs
  // more consumes more quota, and a proxy that tracks it proportionally is enough to hold a queue
  // back. The weighting is not optional — measured over one week of real transcripts, cache reads
  // were 16.0 billion tokens against 39.6 million output tokens, so an unweighted sum is 99.8%
  // cache read and moves only when the cache does.
  weights: {
    input: 1,
    cacheCreation: 1.25,
    cacheRead: 0.1,
    output: 5,
  },
  windows: {
    fiveHourMs: 18_000_000,
    sevenDayMs: 604_800_000,
  },
  // Spend is summed into fixed buckets rather than kept per message: a week of real usage is ~59k
  // assistant messages, and an hourly bucket answers both windows from at most 168 numbers.
  bucket: {
    durationMs: 3_600_000,
  },
  scan: {
    // How many transcripts are read at once. A rebuild reads every transcript on the machine —
    // measured at 588 files over the last week — so opening them all together would exhaust the
    // process's file handles and hold the whole tree in memory at the same time.
    batchSize: 16,
    // The guardrail polls every few seconds, but a scan stats ~2,200 files. Re-measuring at that
    // cadence would spend real CPU to learn nothing: an agent's turn takes far longer than this,
    // so a minute-old measurement is as current as a fresh one for deciding whether to dispatch.
    minIntervalMs: 60_000,
  },
} as const;
