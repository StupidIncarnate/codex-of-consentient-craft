/**
 * PURPOSE: Maps each Claude-spawning work-item role to the Claude CLI --model flag value
 *
 * USAGE:
 * roleToModelStatics.codeweaver;
 * // Returns 'sonnet'
 *
 * THIS MAP IS WHAT THE ROLE ACTUALLY RUNS ON. `buildSpawnInstructionLayerBroker` never sets a
 * `model` on the instruction it builds — only a smoketest override does — so
 * `spawn-one-agent-layer-broker` falls through to `roleToModelTransformer({ role })` and reads this
 * for every real dispatch. The `model` field on `agentNameToPromptTransformer`'s result is a
 * separate value that `get-agent-prompt` REPORTS; changing that one alone moves nothing.
 *
 * THE FIVE OPERATOR ROLES RUN ON SONNET, and that follows from what the split made them. An
 * operator never opens a source file, writes no code, renders no verdict and judges no correctness
 * — its whole job is to dispatch three minions in order, read a plan back off the quest, run two
 * gates and route what comes back. The reasoning those steps need is bounded and mechanical.
 * Everything expensive moved DOWN into the minions, where `agentNameToPromptTransformer` fixes the
 * models per minion rather than per role: `planner-minion` and `reviewer-minion` on opus (planning
 * is the hard part, and the reviewer is the only session on the round that verifies anything),
 * `worker-minion` on sonnet. Downgrading the REVIEWER is the expensive mistake; the operator above
 * it is not that session.
 *
 * `spiritmender` is sonnet for the same shape of reason — it repairs against a ward blob that names
 * the failures for it. `warpgate` stays on opus: a base merge into a quest branch is open-ended
 * conflict resolution with no plan and no minions, and its repair loop is deliberately unbounded.
 * The four CHAT roles stay on opus because each is a live conversation with the user, where the
 * quality of the spec produced is the entire deliverable.
 */

export const roleToModelStatics = {
  chaoswhisperer: 'opus',
  glyphsmith: 'opus',
  bughunt: 'opus',
  tavernkeeper: 'opus',
  flowrider: 'sonnet',
  groundstomper: 'sonnet',
  siegemaster: 'sonnet',
  codeweaver: 'sonnet',
  spiritmender: 'sonnet',
  pesteater: 'sonnet',
  warpgate: 'opus',
} as const;
