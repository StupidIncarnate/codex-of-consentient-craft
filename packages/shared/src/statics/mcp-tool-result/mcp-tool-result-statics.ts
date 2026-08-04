/**
 * PURPOSE: Bounds on the size of an MCP tool result, so a payload this repo serves is always
 * delivered to the calling agent verbatim rather than spilled to a file.
 *
 * USAGE:
 * mcpToolResultStatics.maxVerbatimChars;
 * // Returns the character ceiling a serialized tool-result text block must stay under
 *
 * Claude Code weighs every MCP tool result before handing it to the model. Over `maxOutputTokens`
 * (its `MAX_MCP_OUTPUT_TOKENS` default) the content is NOT delivered: it is written to
 * `<projectDir>/tool-results/<toolUseId>.json` and the agent receives an error stub instructing it
 * to go read the file in chunks. For a served agent prompt that is a silent dispatch failure — the
 * agent starts its session holding a path instead of its instructions.
 *
 * Before spending a real tokenizer call, Claude Code takes a cheap early-out: it estimates
 * `Math.round(chars / estimatedCharsPerToken)` and returns the content untouched when that lands at
 * or below `maxOutputTokens * verbatimTokenFactor`. `maxVerbatimChars` is that early-out expressed
 * in characters, and it is the bound worth holding: it is deterministic, checkable offline, and
 * clears the real ceiling with room for the tokenizer to disagree with the estimate. Dense markdown
 * — tables, fenced code, backticks — tokenizes far below four characters per token, so a payload
 * that merely clears `maxOutputTokens` on an estimate can still be spilled in practice.
 *
 * `jsonIndentSpaces` is the indent every MCP responder serializes with. It belongs here because the
 * measured length is the length AFTER serialization: the budget and the serializer have to agree,
 * or a size check is measuring a string the protocol never sees.
 */

export const mcpToolResultStatics = {
  maxOutputTokens: 25_000,
  verbatimTokenFactor: 0.5,
  estimatedCharsPerToken: 4,
  maxVerbatimChars: 50_000,
  jsonIndentSpaces: 2,
} as const;
