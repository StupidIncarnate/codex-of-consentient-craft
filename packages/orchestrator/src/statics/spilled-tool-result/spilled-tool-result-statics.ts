/**
 * PURPOSE: The one rule for a tool result too large to return inline, written once and interpolated
 * into every prompt that fetches quest data. It NAMES NO TOOL: several host prompts are tested
 * against mentioning a sibling role's tool, so a block listing `get-blight-checklist` reds seven of
 * them at once — and a rule that holds for every fetch needs no tool name to say so.
 *
 * Reach for this when you want to change what EVERY session does with a spilled result; a fetch rule
 * that binds one role belongs in that role's own prompt instead.
 *
 * USAGE:
 * spilledToolResultStatics.markdown;
 * // The read-it-whole rule, ready to interpolate beside a prompt's own get-quest call
 *
 * IT EXISTS BECAUSE THE HARNESS'S OWN NOTICE ARGUES THE OTHER WAY. A spilled result comes back as an
 * error stub whose text offers `offset`/`limit` to "read specific portions" and suggests searching
 * within the file. That advice is written for a log or a dump, where a session genuinely wants one
 * span. A spilled `get-quest` is the opposite: it is the session's whole scope, and the part skipped
 * is a flow nobody builds or a contract nobody adds. Left unsaid, a session reads the stub as a
 * failure or takes the notice at its word and skims.
 *
 * NO `##` HEADING, DELIBERATELY. Several prompts pin their top-level heading list by exact value, so
 * a block introducing one would red those tests and — worse — change the shape of the role every
 * time it is interpolated. Bold lead lines carry the same weight inside whatever section hosts it.
 *
 * BUDGET: every prompt that fetches quest data interpolates this whole block, so a character here is
 * a character served a dozen times over, and each host prompt has to clear
 * `mcpToolResultStatics.maxVerbatimChars` on its own. Keep it to the rule and the reason.
 */

export const spilledToolResultStatics = {
  markdown: `**A tool result too large to return inline is READ IN FULL — never skimmed, never summarised.**
When a fetch answers with an error stub naming a file it saved the output to, the data is not lost
and the call did not fail: it moved. \`Read\` that file from its first line to its last, in sequential chunks where one read cannot hold it, BEFORE you
act on any part of it.

**The stub's own advice is wrong for this file.** It offers \`offset\` and \`limit\` to read "specific
portions" and suggests searching within it — guidance written for a log, where one span is what a
reader wants. This file is your whole scope. The flow you skipped is a flow nobody builds, the unit
you skipped is a unit nobody signs, and the contract you skipped ships missing. Re-calling the tool
returns the same oversized result, so the file is the only route to it.`,
} as const;
