/**
 * PURPOSE: How a session marks each unit it was assigned, written once and interpolated into every
 * prompt that holds units. Reach for this when you want to change what EVERY such session does with
 * its marks; a rule only one step's session follows belongs in that step's own prompt.
 *
 * USAGE:
 * unitMarkingStatics.markdown;
 * // The three marks, when each is written and what each carries, ready to interpolate into a prompt
 *
 * THE MARKS ARE THE RECORD THE ROUTER READS. `met` and `cant-meet` settle a unit; `unmet` is what
 * mints a successor scoped to exactly the units still open. Nothing counts marks and no gate grades
 * their values — the one gate that exists refuses a signal while an assigned unit carries no mark at
 * all, which is why "never mark a unit you did not settle" is prompt text rather than a check.
 *
 * BUDGET: every prompt that holds units interpolates this whole block, so a character here is that
 * many characters served, and each of those prompts has to clear
 * `mcpToolResultStatics.maxVerbatimChars` on its own.
 */

export const unitMarkingStatics = {
  markdown: `## Marking your units

**Mark each unit the moment you settle it, never in one block at the end.** Sessions here run long
enough to die mid-piece, and one that dies having marked nothing loses all of it. Marking at the end
also means transcribing from memory.

| Mark | Write it when | It must carry |
|---|---|---|
| \`met\` | you settled it and can say how | the evidence — a test \`file:line\` and the wrong value that turns it red, or the value measured off the running system |
| \`cant-meet\` | nobody in this role could settle it at this layer | \`toSettle\` — the action that WOULD settle it, as an instruction |
| \`unmet\` | real work remains | what is left, and what you already learned. That note reaches your successor |

**\`unmet\` is not failure and costs nothing.** A session marking its remainder \`unmet\` and stopping is
doing the right thing. Pushing on with no context left is what produces a \`met\` nobody can trust.

**Never mark a unit you did not settle.** The gate forces a mark on every one and cannot tell a real
\`met\` from a hopeful one, so nothing but you stands between a \`met\` you hoped for and everything the
quest builds on top of it.

**\`toSettle\` is an instruction, not a question.** "Drive a real send through a live quest and read the
session JSONL for a Read call on the written path" — never "how should this be tested?".`,
} as const;
