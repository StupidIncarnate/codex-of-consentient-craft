/**
 * PURPOSE: Top-level fields on ModifyQuestInput that the per-status allowlist gate inspects
 *
 * USAGE:
 * for (const field of inspectableModifyQuestInputFieldsStatics) { ... }
 * // Iterates the input field names that the forbidden-fields transformer should consider.
 * // `questId` is intentionally omitted — it is required on every call, never subject to the allowlist.
 */

export const inspectableModifyQuestInputFieldsStatics = [
  'designDecisions',
  'steps',
  'toolingRequirements',
  'contracts',
  'flows',
  'status',
  'title',
  'designPort',
  'workItems',
  'wardResults',
] as const;
