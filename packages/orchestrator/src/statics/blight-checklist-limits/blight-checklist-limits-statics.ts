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
 * (204 changed files once test/proxy companions are counted), which at four `BlightConcern`
 * values is 680 units (`blight-checklist-to-text-transformer.test.ts`,
 * `describe('scale — a real quest-sized diff')`) and renders at 26,358 chars — about 38.8
 * chars/unit in the common all-remaining shape, roughly half of
 * `mcpToolResultStatics.maxVerbatimChars` (50,000).
 *
 * The character ceiling, not the unit count, is what sets `maxUnits`. Each `### <implPath>`
 * heading is amortized over only four units (one per `BlightConcern`), and this repo's impl paths
 * average ~95 chars, so the render costs ~40 chars/unit in the worst per-file shape — a file whose
 * disposition status alternates, needing BOTH a `[x]` line and a `[ ]` line. Measured directly
 * (the sibling assertion beside `describe('scale — a real quest-sized diff')` in
 * `blight-checklist-to-text-transformer.test.ts`): at 1,200 units (300 files × 4 concerns) that
 * worst-case shape renders 48,256 chars, under `maxVerbatimChars` with 1,744 chars of headroom.
 * The literal largest multiple of four that still fits is 1,244 units (49,999 chars — one char of
 * headroom); 1,248 units (50,161 chars) does not. 1200 sits below that edge on purpose: real
 * diffs' impl paths vary in length and only get longer as this repo grows, so the cap trades a
 * few dozen spare units for headroom measured in the thousands of characters rather than in one.
 *
 * 1200 factors as 4 × 300, a whole multiple of `blightConcernLegendStatics.byConcern`'s four keys
 * (pinned 1:1 with `blightConcernContract`'s options), so a truncation split always lands on a
 * concern boundary rather than cutting a file's concerns mid-list. That property survives a
 * change in how many concerns the contract carries as long as the new count still divides 1200
 * evenly.
 *
 * Truncating past this cap is SAFE, not just tolerable. `quest-handle-signal-back-responder`'s
 * completion gate recomputes the outstanding unit set server-side from the same build transformer
 * this render is a view of — it never trusts what an agent claims it saw. A truncated render can
 * under-inform an agent (forcing another `get-blight-checklist` call after it dispositions what it
 * can see), which only slows the agent down; it can never produce a false `done`, because the gate
 * still sees every unit the render left out.
 */

export const blightChecklistLimitsStatics = {
  maxUnits: 1200,
} as const;
