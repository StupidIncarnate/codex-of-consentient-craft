/**
 * PURPOSE: Bounds how many review units `blightChecklistToTextTransformer` renders, so a
 * pathological diff cannot blow the MCP tool-result ceiling even after the per-file compaction
 * that collapses the repeated impl path down to one heading per file
 *
 * USAGE:
 * blightChecklistLimitsStatics.maxUnits;
 * // Returns the cap on rendered file × concern units before the render truncates
 *
 * The largest diff measured against this repo's own review surface is 170 changed files / 1,190
 * units (`blight-checklist-to-text-transformer.test.ts`, `describe('scale — a real quest-sized
 * diff')`), rendering at 31,343 chars. This cap — a multiple of the seven `BlightConcern` values,
 * so a mid-file truncation split always lands on a whole concern rather than a fragment — sits
 * ~34% above that real max, a backstop rather than a working constraint (the same relationship
 * `qaChecklistLimitsStatics.maxPaths` has to its own largest observed count).
 *
 * The bound is sized against the WORST render case, not the best: a checklist whose disposition
 * status alternates within every file (so every file needs BOTH a `[x]` and a `[ ]` line, the most
 * expensive per-file shape) measures ~27.5 chars/unit at this scale. At `maxUnits` that worst case
 * renders ~43,500 chars — comfortably under `mcpToolResultStatics.maxVerbatimChars` (50,000), with
 * room for the tokenizer to disagree with the char-based estimate the same way
 * `mcpToolResultStatics` itself budgets for.
 *
 * Truncating past this cap is SAFE, not just tolerable. `quest-handle-signal-back-responder`'s
 * completion gate recomputes the outstanding unit set server-side from the same build transformer
 * this render is a view of — it never trusts what an agent claims it saw. A truncated render can
 * under-inform an agent (forcing another `get-blight-checklist` call after it dispositions what it
 * can see), which only slows the agent down; it can never produce a false `done`, because the gate
 * still sees every unit the render left out.
 */

export const blightChecklistLimitsStatics = {
  maxUnits: 1596,
} as const;
