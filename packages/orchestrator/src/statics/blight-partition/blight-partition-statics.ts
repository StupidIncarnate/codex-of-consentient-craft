/**
 * PURPOSE: The concrete numbers the Blightwarden operator partitions a diff by — how many changed
 * files one `blightwarden-group-minion` carries, and how many of those minions may be in flight at
 * once — so "sized for one minion to hold carefully" is a value with a pinned test rather than a
 * judgement each session re-invents
 *
 * USAGE:
 * blightPartitionStatics.targetFilesPerGroup;
 * // Returns the target number of changed files in one blightwarden-group-minion's group
 * blightPartitionStatics.maxConcurrentMinions;
 * // Returns the ceiling on blightwarden-group-minions dispatched in a single parallel wave
 *
 * WHY 6 FILES PER GROUP. The root `CLAUDE.md` caps a mechanical cleanup agent at "1-3 files per
 * cleanup agent, maximum", because agents handed large batches optimise for throughput over
 * correctness and invent evasions that pass lint without improving anything. A blight group is
 * counted in impl+test PAIRS rather than loose files: an implementation file and its colocated test
 * are one indivisible reading, and Gate 3's disjoint-by-file rule forbids splitting a pair across
 * two minions (two minions editing one file produce phantom typecheck failures that get
 * misdiagnosed as stale dist). Six files is three such pairs — the same order of magnitude as that
 * ceiling, expressed in the unit this role actually reviews.
 *
 * WHY 8 CONCURRENT. The largest diff measured against this repo's own review surface is 170 changed
 * files (`blightChecklistLimitsStatics`, whose cap is sized against that same measurement). At six
 * files per group that is 29 groups, and at eight in flight that is four sequential first-wave
 * dispatches before the two whole-diff waves. Raising the cap does not buy proportional speed,
 * because the cost it spends is the PARENT's: the operator must read every returned artifact and
 * open the files each minion actually changed, all inside one context, and it cuts every brief in a
 * wave from a single `get-blight-checklist` read that is itself bounded (via
 * `blightChecklistLimitsStatics.maxUnits`) to fit under `mcpToolResultStatics.maxVerbatimChars`. A
 * wave wider than the operator can verify converts a review into a rubber stamp, which is the
 * failure this whole role exists to remove.
 */

export const blightPartitionStatics = {
  targetFilesPerGroup: 6,
  maxConcurrentMinions: 8,
} as const;
