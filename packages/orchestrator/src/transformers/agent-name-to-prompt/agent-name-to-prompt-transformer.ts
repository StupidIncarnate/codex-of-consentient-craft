/**
 * PURPOSE: Resolves an agent prompt name to the result `get-agent-prompt` serves — the ONE table
 * every served prompt resolves through, for a relay role and a parent-summoned minion alike. Reach
 * for `workItemToPromptTransformer` instead when you hold a WORK ITEM and want the prompt with its
 * operation context already substituted in.
 *
 * USAGE:
 * agentNameToPromptTransformer({ agent: agentPromptNameContract.parse('codeweaver') });
 * // Returns { name: 'codeweaver', model: 'opus', prompt: '...' } — `$ARGUMENTS` still
 * // unsubstituted, for the caller that owns the operation context.
 *
 * NOTHING IS INTERPOLATED HERE. Every prompt is one file holding its own text, so this transformer
 * looks a name up and returns it.
 *
 * A TABLE, WITH NO `satisfies` CLAUSE LEFT TO KEEP IT SAFE. `agentPromptNameContract` is an OPEN
 * branded string now — a quest that ran under a renamed prompt still has to LOAD — and a branded,
 * non-literal string has no finite key set for `Record<AgentPromptName, unknown>` to check an object
 * literal's keys against: TypeScript refuses every key as excess rather than falling back to an
 * index signature the way it does for bare `string` (confirmed against this repo's own tsconfig; a
 * bare `string` key fares no better, since a raw `string` type outside a function parameter trips
 * `@dungeonmaster/ban-primitives`). So the compile-time exhaustiveness this table carried while the
 * contract was a closed enum is GONE, not preserved under another name — a name added to the roster
 * with no row here no longer fails to build. The missing-row case is caught at DISPATCH instead: the
 * `agent in AGENT_PROMPTS` check below is a REAL runtime test (the object's keys are a closed set;
 * `agent`'s type is not), and the throw names the name rather than letting `entry.model` fail against
 * `undefined`. `as const` still preserves each entry's real type for the reads below.
 *
 * MODELS ARE READ, NEVER LITERAL, for the roles. `roleToModelStatics` is what the CLI `--model` flag
 * resolves through — `buildSpawnInstructionLayerBroker` sets no model, so every real dispatch falls
 * through to it — while the value here is only what `get-agent-prompt` REPORTS. A literal would let
 * the two disagree in the direction nothing surfaces. Minion models have no such map and are stated
 * here, all on sonnet: a minion arrives with its scope already narrowed by the brief that summoned
 * it, and its parent is the opus session that decided that scope.
 */

import { agentPromptResultContract, type AgentPromptResult } from '@dungeonmaster/shared/contracts';

import type { AgentPromptName } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import { chaoswhispererGapMinionStatics } from '../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { codeweaverPlannerStatics } from '../../statics/codeweaver-planner/codeweaver-planner-statics';
import { codeweaverWorkerStatics } from '../../statics/codeweaver-worker/codeweaver-worker-statics';
import { codeweaverReviewerStatics } from '../../statics/codeweaver-reviewer/codeweaver-reviewer-statics';
import { flowriderPlannerStatics } from '../../statics/flowrider-planner/flowrider-planner-statics';
import { flowriderWorkerStatics } from '../../statics/flowrider-worker/flowrider-worker-statics';
import { flowriderReviewerStatics } from '../../statics/flowrider-reviewer/flowrider-reviewer-statics';
import { roleToModelStatics } from '../../statics/role-to-model/role-to-model-statics';
import { siegePlannerStatics } from '../../statics/siege-planner/siege-planner-statics';
import { siegeAdversarialFixerStatics } from '../../statics/siege-adversarial-fixer/siege-adversarial-fixer-statics';
import { siegeAdversarialWalkerStatics } from '../../statics/siege-adversarial-walker/siege-adversarial-walker-statics';
import { siegeHappyFixerStatics } from '../../statics/siege-happy-fixer/siege-happy-fixer-statics';
import { siegeHappyWalkerStatics } from '../../statics/siege-happy-walker/siege-happy-walker-statics';
import { recipeMakerStatics } from '../../statics/recipe-maker/recipe-maker-statics';
import { siegemasterReaderStatics } from '../../statics/siegemaster-reader/siegemaster-reader-statics';
import { spiritmenderPromptStatics } from '../../statics/spiritmender-prompt/spiritmender-prompt-statics';
import { warpgatePromptStatics } from '../../statics/warpgate-prompt/warpgate-prompt-statics';

const AGENT_PROMPTS = {
  'chaoswhisperer-gap-minion': {
    model: 'sonnet',
    template: chaoswhispererGapMinionStatics.prompt.template,
  },

  'codeweaver-planner': {
    model: roleToModelStatics.codeweaver,
    template: codeweaverPlannerStatics.prompt.template,
  },
  'codeweaver-worker': {
    model: roleToModelStatics.codeweaver,
    template: codeweaverWorkerStatics.prompt.template,
  },
  'codeweaver-reviewer': {
    model: 'sonnet',
    template: codeweaverReviewerStatics.prompt.template,
  },

  'flowrider-planner': {
    model: roleToModelStatics.flowrider,
    template: flowriderPlannerStatics.prompt.template,
  },
  'flowrider-worker': {
    model: roleToModelStatics.flowrider,
    template: flowriderWorkerStatics.prompt.template,
  },
  'flowrider-reviewer': {
    model: 'sonnet',
    template: flowriderReviewerStatics.prompt.template,
  },

  'siege-planner': {
    model: roleToModelStatics.siegemaster,
    template: siegePlannerStatics.prompt.template,
  },
  'siege-adversarial-fixer': {
    model: 'sonnet',
    template: siegeAdversarialFixerStatics.prompt.template,
  },
  'siege-adversarial-walker': {
    model: 'sonnet',
    template: siegeAdversarialWalkerStatics.prompt.template,
  },
  'siege-happy-fixer': { model: 'sonnet', template: siegeHappyFixerStatics.prompt.template },
  'siege-happy-walker': { model: 'sonnet', template: siegeHappyWalkerStatics.prompt.template },
  'recipe-maker': { model: 'opus', template: recipeMakerStatics.prompt.template },
  'siegemaster-reader': { model: 'sonnet', template: siegemasterReaderStatics.prompt.template },

  spiritmender: {
    model: roleToModelStatics.spiritmender,
    template: spiritmenderPromptStatics.prompt.template,
  },
  warpgate: {
    model: roleToModelStatics.warpgate,
    template: warpgatePromptStatics.prompt.template,
  },
} as const;

export const agentNameToPromptTransformer = ({
  agent,
}: {
  agent: AgentPromptName;
}): AgentPromptResult => {
  if (!(agent in AGENT_PROMPTS)) {
    throw new Error(
      `Unknown agent prompt name: '${agent}'. No prompt is registered for it in AGENT_PROMPTS — ` +
        'check agentPromptClassificationStatics.promptNames and this table still agree.',
    );
  }

  const entry = AGENT_PROMPTS[agent as keyof typeof AGENT_PROMPTS];

  return agentPromptResultContract.parse({
    name: agent,
    model: entry.model,
    prompt: entry.template,
  });
};
