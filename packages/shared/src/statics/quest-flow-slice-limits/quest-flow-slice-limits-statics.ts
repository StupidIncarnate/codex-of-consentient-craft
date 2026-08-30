/**
 * PURPOSE: Bounds what `questFlowSliceTransformer` renders — the hard character ceiling the whole
 * slice is cut at, so a pathological quest cannot blow the MCP tool-result budget. Reach for this
 * rather than `questSummaryLimitsStatics`: that one bounds a REPORT whose sections are lists and can
 * therefore cap by entry count, while a slice's cost is one graph plus its prose and has no list to
 * cap — only the character ceiling actually bounds it.
 *
 * USAGE:
 * questFlowSliceLimitsStatics.maxRenderChars;
 * // Returns the character ceiling the rendered slice is cut at before its truncation notice
 *
 * WHY A CEILING AND NOT A COUNT. Every term in a slice is already bounded by the SHAPE of the call:
 * one flow, its own contracts, the decisions that govern its nodes. What is not bounded is how much
 * an author wrote — an observable's description, a decision's rationale, a contract property's
 * requirement — and none of those may be cut per-field, because the sentence is the requirement.
 * A whole-render cut is the only honest bound, and it is loud when it fires.
 *
 * MEASURED AGAINST THE LARGEST FLOW OF A REAL QUEST: 18 nodes, 19 edges, 47 observables, 12
 * contracts and 33 design decisions render at roughly 32,000 characters — comfortably under both
 * this ceiling and `mcpToolResultStatics.maxVerbatimChars` (50,000), with nothing truncated. The
 * headroom between the two is what carries the truncation notice and absorbs dense markdown
 * tokenizing worse than the four-characters-per-token estimate `maxVerbatimChars` is derived from.
 *
 * TRUNCATING IS SAFE. The slice is a spec READ, never a gate: nothing downstream computes coverage
 * or completion from it (`get-qa-checklist` derives the denominator server-side from quest.json).
 * A cut can under-inform a session, which the notice and its exact dropped count make visible; it
 * can never let an unsigned unit pass for a signed one.
 */

export const questFlowSliceLimitsStatics = {
  maxRenderChars: 48_000,
} as const;
