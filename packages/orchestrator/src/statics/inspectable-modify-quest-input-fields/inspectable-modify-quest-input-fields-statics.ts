/**
 * PURPOSE: LLM-facing fields on ModifyQuestInput that the per-status allowlist gate inspects
 *
 * USAGE:
 * for (const field of inspectableModifyQuestInputFieldsStatics) { ... }
 * // Iterates the input field names that the forbidden-fields transformer should consider.
 * // `questId` is intentionally omitted — it is required on every call, never subject to the allowlist.
 * // Server-only fields (`workItems`, `wardResults`, `designPort`) are intentionally OMITTED — they
 * // are stripped by the MCP layer for LLM calls and only set by internal orchestration code that
 * // bypasses MCP (orchestration loop, ward layer broker, design scaffolder). Putting them here
 * // would block legitimate internal mutations regardless of quest status.
 * // `comments` IS inspected, unlike those three: it is legitimately writable — through the
 * // comment-batch route's own server-side write — but only before the quest reaches `approved`,
 * // since the comment compose controls render only pre-approval. That's a per-status decision
 * // (see quest-status-input-allowlist-statics), so `comments` belongs on this list rather than
 * // being unconditionally stripped like `workItems`/`wardResults`/`designPort`.
 */

export const inspectableModifyQuestInputFieldsStatics = [
  'designDecisions',
  'operations',
  'toolingRequirements',
  'contracts',
  'flows',
  'comments',
  'status',
  'title',
  'planningNotes',
  'packagesAffected',
] as const;
