/**
 * PURPOSE: Bounds how many operations-ledger lines `workItemToPromptTransformer` renders into the
 * `$ARGUMENTS` block served through `get-agent-prompt`, so a ledger that grows without bound cannot
 * push the served MCP tool result past `mcpToolResultStatics.maxVerbatimChars`.
 *
 * USAGE:
 * operationsLedgerRenderStatics.maxRenderedItems;
 * // Returns the number of ledger lines the render targets before it elides oldest-completed items
 *
 * **Why a bound exists at all.** The ledger is the only unbounded term in the served block: every
 * `operationStatus: 'partial'` outcome appends a `pt N` continuation, so the line count rises for
 * the whole life of a quest. Over `maxVerbatimChars` the MCP layer does not shorten the payload —
 * it spills it to `<projectDir>/tool-results/<toolUseId>.json` and hands the agent an error stub, so
 * the agent starts its session holding a path instead of instructions. A prompt that loses its TAIL
 * loses its gates and numbered rules, which is a silently de-gated agent.
 *
 * **The arithmetic**, measured against the relay-scale fixture in
 * `work-item-to-prompt-transformer.test.ts` (280-character operation texts, seven flows, five
 * affected packages, a 1,530-character user request):
 *
 * - `flowrider` has the largest prompt template and therefore sets the budget: its served block is
 *   49,220 characters at 21 ledger lines and 54,958 at 40.
 * - (54,958 − 49,220) / 19 = 302 characters per ledger line in the serialized block (a 300-character
 *   line plus its escaped newline).
 * - Non-ledger remainder = 49,220 − 21 × 302 = 42,878.
 * - The ceiling is 50,000, so the entire ledger render may spend 50,000 − 42,878 = 7,122 characters
 *   = 23 lines. One of those goes to the 149-character elision notice, leaving 22 as the absolute
 *   maximum.
 * - `maxRenderedItems: 16` spends 42,878 + 16 × 302 + 149 = 47,859 and so leaves ~2,140 characters
 *   of headroom — roughly seven lines of slack for operation texts longer than the fixture's 280
 *   characters, versus the 780 the unbounded render left.
 * - Measured back against the same fixture, `flowrider`'s bounded block is 47,868 at a 40-item
 *   ledger and 47,885 at a 200-item one: the residual 17-character drift over 160 extra items is
 *   the width of the 1-based positions, which is the only term that still grows.
 *
 * **The bound is deliberately soft in one direction.** The agent's own item and every
 * `in_progress` / `pending` item are ALWAYS rendered, so a ledger whose non-complete tail alone
 * exceeds `maxRenderedItems` renders past the cap. An agent that cannot see the work still ahead of
 * it cannot verify it is the right next step, which is the whole reason the ledger is in the prompt.
 * That is not the overflow it looks like: the two largest templates (`flowrider`, `siegemaster`)
 * dispatch at the END of the relay, against a ledger that is almost entirely `complete`, while
 * `codeweaver` — the role dispatched against an all-pending ledger — carries a remainder of 33,542
 * and so clears (50,000 − 33,542) / 302 = 54 lines before it reaches the ceiling.
 *
 * `minRecentCompleteItems` is the floor of most-recent completed items kept even when the
 * non-complete tail alone fills the cap, so an agent always sees what immediately preceded it.
 */

export const operationsLedgerRenderStatics = {
  maxRenderedItems: 16,
  minRecentCompleteItems: 3,
} as const;
