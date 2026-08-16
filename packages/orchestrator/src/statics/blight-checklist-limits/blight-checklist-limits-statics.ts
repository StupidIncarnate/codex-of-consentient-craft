/**
 * PURPOSE: Bounds how many review units `blightChecklistToTextTransformer` renders, so a
 * pathological diff cannot blow the MCP tool-result ceiling even after the per-file compaction
 * that collapses the repeated impl path down to one heading per file
 *
 * USAGE:
 * blightChecklistLimitsStatics.maxUnits;
 * // Returns the cap on rendered file × concern units before the render truncates
 *
 * The largest diff measured against this repo's own review surface is 170 changed impl groups
 * (204 changed files once test/proxy companions are counted), which at five `BlightConcern`
 * values is 850 units (`blight-checklist-to-text-transformer.test.ts`,
 * `describe('scale — a real quest-sized diff')`) and renders at 28,597 chars — about 33.6
 * chars/unit in the common all-remaining shape, well inside
 * `mcpToolResultStatics.maxVerbatimChars` (50,000).
 *
 * The character ceiling, not the unit count, is what sets `maxUnits`. Each `### <implPath>`
 * heading is amortized over the concerns crossing that one file, and this repo's impl paths
 * average ~95 chars, so the render costs ~35 chars/unit in the worst per-file shape — a file whose
 * disposition status alternates, needing BOTH a `[x]` line and a `[ ]` line. Measured directly
 * (the sibling assertion beside `describe('scale — a real quest-sized diff')` in
 * `blight-checklist-to-text-transformer.test.ts`): at 1,200 units (240 files × 5 concerns) that
 * worst-case shape renders 41,767 chars, under `maxVerbatimChars` with 8,233 chars of headroom.
 * The cap is deliberately left well short of the edge: real diffs' impl paths vary in length and
 * only get longer as this repo grows, so it trades spare units for headroom measured in the
 * thousands of characters rather than in one. That is also why the sibling assertion derives its
 * file count from the concern count the build transformer actually produces rather than hardcoding
 * it — the last time the concern count changed, the cap silently drifted out of budget with nothing
 * catching it.
 *
 * 1200 factors as 5 × 240, a whole multiple of `blightConcernLegendStatics.byConcern`'s five keys
 * (pinned 1:1 with `blightConcernContract`'s options), so a diff of fully-eligible files truncates
 * on a concern boundary rather than cutting a file's concerns mid-list. A declaration-shaped file
 * crosses only three (`blightConcernGatingStatics` withholds `perf` and `integrity` from it), so a
 * mixed diff has no such guarantee — which costs nothing, because the render prioritizes REMAINING
 * units over dispositioned ones and states its own truncation.
 *
 * Truncating past this cap only slows a reviewer down. The REMAINING count in the header is
 * computed off the UNTRUNCATED checklist, so a short render still says how much is left, and the
 * reviewer dispositions what it can see and calls `get-blight-checklist` again for the rest.
 */

export const blightChecklistLimitsStatics = {
  maxUnits: 1200,
} as const;
