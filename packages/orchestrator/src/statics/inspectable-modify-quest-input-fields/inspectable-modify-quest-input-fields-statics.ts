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
 */

export const inspectableModifyQuestInputFieldsStatics = [
  'designDecisions',
  'steps',
  'toolingRequirements',
  'contracts',
  'flows',
  'status',
  'title',
  'planningNotes',
] as const;
