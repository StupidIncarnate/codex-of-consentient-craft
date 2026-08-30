/**
 * PURPOSE: Holds the exact wording `get-quest` refuses a conflicting argument pair with, so the
 * shared input contract and the MCP wrapper that extends it with `format` cannot drift into two
 * different explanations of the same rejection. Reach for this rather than writing the sentence at
 * either call site — a caller reads only ONE of the two, and the one it reads has to name the call
 * it should make instead.
 *
 * USAGE:
 * getQuestInputConflictsStatics.flowIdWithStage;
 * // The message a { flowId, stage } call is rejected with
 *
 * NEITHER MESSAGE CARRIES A DOUBLE QUOTE. A zod issue message is delivered JSON-escaped inside the
 * ZodError's own text, so a quoted phrase reaches the reader as `\"…\"` and stops matching the
 * source string it was written as.
 */

export const getQuestInputConflictsStatics = {
  flowIdWithStage:
    'flowId cannot be combined with stage — stage selects which SECTIONS of the quest come back, flowId selects WITHIN the flows section, and a stage that excludes flows returns an empty answer that reads as the flow being empty. Pass flowId alone, optionally with packageName.',
  packageNameWithStage:
    'packageName cannot be combined with stage — stage selects which SECTIONS of the quest come back, packageName narrows the flow slice to one package, and a stage that excludes flows or contracts returns an empty answer that reads as the package owning nothing. Pass packageName alone, or with flowId.',
} as const;
