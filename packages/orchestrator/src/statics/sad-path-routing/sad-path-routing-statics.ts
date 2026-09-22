/**
 * PURPOSE: Where a session goes when the ordinary path does not apply, written once and interpolated
 * into every prompt in the set that runs a step. Reach for this when you want to change what EVERY
 * session does on a sad path; a situation only one role meets belongs in that role's own prompt.
 *
 * USAGE:
 * sadPathRoutingStatics.markdown;
 * // The five situations, what the session does in each and where it lands, ready to interpolate
 *
 * EVERY ROW ENDS SOMEWHERE THE ROUTER CAN READ. A session reports; it never routes. So each row
 * names an action the session can actually take — a mark, an outcome word, an amendment, a request —
 * and then names what the router does with it, because a session that cannot see the consequence
 * invents one: it pads marks to clear the gate, or reports a wall over a queue.
 *
 * BUDGET: every prompt that runs a step interpolates this whole block, so a character here is that
 * many characters served, and each of those prompts has to clear
 * `mcpToolResultStatics.maxVerbatimChars` on its own.
 */

export const sadPathRoutingStatics = {
  markdown: `## The sad paths, and where each lands

| Situation | What you do | Where it lands |
|---|---|---|
| out of scope, or out of context | mark those units \`unmet\` with a note on what is left, then signal | the router mints part two on exactly those |
| cannot be settled at this layer, by anyone in this role | mark \`cant-meet\` with \`toSettle\` | the unit is settled; nothing re-opens it |
| an environment wall — a denied command, a missing credential, an unreachable service | mark what is markable, declare the outcome \`wall\`, then signal | the quest blocks for a human, carrying the reason |
| the plan itself is wrong | \`quest-work\` → \`amendment\`, then mark and signal normally | the router re-reads the plan |
| the seed is wrong or missing | request \`recipe\`, and carry on when it returns | never invent a seed inline |`,
} as const;
