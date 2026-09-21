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
import { codeweaverPromptStatics } from '../../statics/codeweaver-prompt/codeweaver-prompt-statics';
import { codeweaverReviewerStatics } from '../../statics/codeweaver-reviewer/codeweaver-reviewer-statics';
import { flowriderPromptStatics } from '../../statics/flowrider-prompt/flowrider-prompt-statics';
import { flowriderReviewerStatics } from '../../statics/flowrider-reviewer/flowrider-reviewer-statics';
import { roleToModelStatics } from '../../statics/role-to-model/role-to-model-statics';
import { siegemasterPromptStatics } from '../../statics/siegemaster-prompt/siegemaster-prompt-statics';
import { siegemasterReviewerStatics } from '../../statics/siegemaster-reviewer/siegemaster-reviewer-statics';
import { siegemasterStressStatics } from '../../statics/siegemaster-stress/siegemaster-stress-statics';
import { siegemasterVerifierStatics } from '../../statics/siegemaster-verifier/siegemaster-verifier-statics';
import { spiritmenderPromptStatics } from '../../statics/spiritmender-prompt/spiritmender-prompt-statics';
import { warpgatePromptStatics } from '../../statics/warpgate-prompt/warpgate-prompt-statics';

const AGENT_PROMPTS = {
  'chaoswhisperer-gap-minion': {
    model: 'sonnet',
    template: chaoswhispererGapMinionStatics.prompt.template,
  },

  codeweaver: {
    model: roleToModelStatics.codeweaver,
    template: codeweaverPromptStatics.prompt.template,
  },
  'codeweaver-reviewer': {
    model: 'sonnet',
    template: codeweaverReviewerStatics.prompt.template,
  },

  flowrider: {
    model: roleToModelStatics.flowrider,
    template: flowriderPromptStatics.prompt.template,
  },
  'flowrider-reviewer': {
    model: 'sonnet',
    template: flowriderReviewerStatics.prompt.template,
  },

  siegemaster: {
    model: roleToModelStatics.siegemaster,
    template: siegemasterPromptStatics.prompt.template,
  },
  'siegemaster-reviewer': {
    model: 'sonnet',
    template: siegemasterReviewerStatics.prompt.template,
  },
  'siegemaster-stress': {
    model: 'sonnet',
    template: siegemasterStressStatics.prompt.template,
  },
  'siegemaster-verifier': {
    model: 'sonnet',
    template: siegemasterVerifierStatics.prompt.template,
  },

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
