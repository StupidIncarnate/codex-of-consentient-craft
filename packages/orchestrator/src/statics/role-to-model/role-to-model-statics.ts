/**
 * PURPOSE: Maps each Claude-spawning work-item role to the Claude CLI --model flag value
 *
 * USAGE:
 * roleToModelStatics.codeweaver;
 * // Returns 'opus'
 *
 * THIS MAP IS WHAT THE ROLE ACTUALLY RUNS ON. `buildSpawnInstructionLayerBroker` never sets a
 * `model` on the instruction it builds — only a smoketest override does — so
 * `spawn-one-agent-layer-broker` falls through to `roleToModelTransformer({ role })` and reads this
 * for every real dispatch. The `model` field on `agentNameToPromptTransformer`'s result is a
 * separate value that `get-agent-prompt` REPORTS; changing that one alone moves nothing.
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
  glyphsmith: 'opus',
  bughunt: 'opus',
  tavernkeeper: 'opus',
  flowrider: 'opus',
  siegemaster: 'opus',
  codeweaver: 'opus',
  spiritmender: 'sonnet',
  warpgate: 'opus',
} as const;
