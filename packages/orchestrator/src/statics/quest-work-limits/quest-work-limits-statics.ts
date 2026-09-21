/**
 * PURPOSE: Bounds what `get-quest-work` serves — the serialized ceiling the whole return is cut at,
 * and the ORDER its sections are dropped in until it fits. Reach for this rather than
 * `questFlowSliceLimitsStatics`: that one bounds a single rendered flow, and this bounds a return
 * that carries one of those PLUS the units, the piece, two path lists and the git rows.
 *
 * USAGE:
 * questWorkLimitsStatics.budget.maxSerializedChars;
 * // Returns the character ceiling `JSON.stringify(view, null, indentSpaces)` must stay under
 *
 * MEASURE THE SERIALIZED STRING, NOT THE OBJECT, and serialize with `indentSpaces` — the budget and
 * the serializer have to agree, or a size check is measuring a string the protocol never sees.
 *
 * WHY A CEILING AND NOT PER-SECTION ENTRY COUNTS. Every term in this return is already bounded by
 * the SHAPE of the call: one work item, its own units, its own flow. What is unbounded is how much
 * an author wrote — an observable's verbatim text, a mark's evidence, a `toSettle`, a piece's
 * context — and none of those may be cut per-field, because each one IS what its reader was sent to
 * act on. A whole-section cut against the measured string is the only honest bound, and every cut
 * names its section and its exact dropped count in `truncated[]`.
 *
 * THE CUT ORDER IS NOT ARBITRARY AND `assignedUnits`, `inScopeUnits`, `piece`, `scope` AND
 * `uncommittedPaths` ARE NEVER IN IT. The first two are the signal gate's denominator — a session
 * measuring itself against fewer units than the gate counts is the exact failure this surface exists
 * to remove. `piece` and `scope` are the brief. `uncommittedPaths` IS a reviewer's pass, and no
 * session runs `git status` any more to recover it.
 *
 * - `flows` first: `get-quest({ questId, flowId, packageName })` serves exactly this text as its own
 *   call, so a session that loses it has a fetch it can still make.
 * - `committedPaths` next: context for a planner, never a denominator.
 * - `sessionNotes` next: a note never closes a unit.
 * - `walkPaths` last: `pathsTruncated` already exists for the same reason and is the flag to raise.
 */

import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

export const questWorkLimitsStatics = {
  budget: {
    // The same ceiling every other MCP result holds, read from the one place it is derived rather
    // than restated — over it the MCP layer spills the result to a file and hands the agent an
    // error stub, and nothing reports a failure.
    maxSerializedChars: mcpToolResultStatics.maxVerbatimChars,
    indentSpaces: mcpToolResultStatics.jsonIndentSpaces,
  },
  cutOrder: ['flows', 'committedPaths', 'sessionNotes', 'walkPaths'],
} as const;
