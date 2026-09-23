/**
 * PURPOSE: Maps each Claude-spawning work-item role to the Claude CLI --model flag value
 *
 * USAGE:
 * roleToModelStatics.codeweaver;
 * // Returns 'opus'
 *
 * THIS MAP IS THE FALLBACK MODEL FOR A WORK ITEM RUNNING NO STEP GRAPH. Every `kind: 'prompt'` step
 * in `agentFlowStatics` declares its own `model`, and `buildSpawnInstructionLayerBroker` reads that
 * node first — `codeweaver.work` spawns on `sonnet`, `codeweaver.plan` on `opus`, even though both
 * sit inside a `codeweaver` scope. This map answers ONLY for a work item with no step node to read:
 * a role-keyed spiritmender/warpgate dispatch, or a hydrated/legacy quest with no step recorded.
 * `roleToModelTransformer({ role })` is that fallback, read by `buildSpawnInstructionLayerBroker`
 * (the real Node dispatch and the MCP/Task instruction alike) and by `workItemToPromptTransformer`
 * (what `get-agent-prompt` REPORTS) — the same fallback in both places, so a stepless work item is
 * reported on the model it actually runs on. It is also the whole answer for the four CHAT roles
 * and the model `agentNameToPromptTransformer` states for the operator-family PROMPT names below
 * (`codeweaver-planner`, `-worker`, etc.) — that per-name value is read only when SERVING a
 * parent-summoned MINION, never for a role or step prompt, which resolve their model off the work
 * item's own step node instead.
 *
 * THE THREE OPERATOR ROLES RUN ON OPUS, because each of them reads code. An operator plans the
 * work it hands out, judges what comes back against the files it opened, and decides whether its
 * scope is done — none of which is a lookup. The sub-agents it briefs are generic and run on
 * whatever the Agent tool gives them; the named reviewers are fixed at sonnet in
 * `agentNameToPromptTransformer`, which is the one place a minion's model is stated.
 *
 * `spiritmender` is sonnet: it repairs against a ward blob that names the failures for it.
 * `warpgate` stays on opus — a base merge into a quest branch is open-ended conflict resolution
 * with no plan under it. The four CHAT roles stay on opus because each is a live conversation with
 * the user, where the quality of the spec produced is the entire deliverable.
 */

export const roleToModelStatics = {
  chaoswhisperer: 'opus',
  bughunt: 'opus',
  tavernkeeper: 'opus',
  flowrider: 'opus',
  siegemaster: 'opus',
  codeweaver: 'opus',
  spiritmender: 'sonnet',
  warpgate: 'opus',
} as const;
