/**
 * PURPOSE: Resolves an agent prompt name to the result `get-agent-prompt` serves. Reach for this
 * when you hold a NAME; reach for `roleToPromptTemplateTransformer` when you hold an `AgentRole` and
 * want only the template text, because that one's exhaustiveness is keyed on the narrower role union.
 *
 * USAGE:
 * agentNameToPromptTransformer({ agent: agentPromptNameContract.parse('codeweaver') });
 * // Returns { name: 'codeweaver', model: 'opus', prompt: '...' } — `$ARGUMENTS` still
 * // unsubstituted, for the caller that owns the operation context.
 *
 * NOTHING IS INTERPOLATED HERE. Every prompt is one file holding its own text, so this transformer
 * looks a name up and returns it.
 *
 * A TABLE RATHER THAN A SWITCH, and the `satisfies` is what keeps that safe. `Record<AgentPromptName,
 * unknown>` is exhaustive over the same union a `never` default checked: a name added to
 * `agentPromptClassificationStatics.promptNames` without a prompt behind it fails to compile here,
 * and a key that is not a valid name fails the object literal's excess-property check. `unknown` is
 * the value type on purpose — the branded contract fields would need raw `string` to describe, and
 * `as const` preserves each entry's real type for the reads below regardless of what `satisfies`
 * compares against.
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
import { siegemasterWalkerStatics } from '../../statics/siegemaster-walker/siegemaster-walker-statics';
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
  'siegemaster-walker': {
    model: 'sonnet',
    template: siegemasterWalkerStatics.prompt.template,
  },

  spiritmender: {
    model: roleToModelStatics.spiritmender,
    template: spiritmenderPromptStatics.prompt.template,
  },
  warpgate: {
    model: roleToModelStatics.warpgate,
    template: warpgatePromptStatics.prompt.template,
  },
} as const satisfies Record<AgentPromptName, unknown>;

export const agentNameToPromptTransformer = ({
  agent,
}: {
  agent: AgentPromptName;
}): AgentPromptResult => {
  const entry = AGENT_PROMPTS[agent];

  return agentPromptResultContract.parse({
    name: agent,
    model: entry.model,
    prompt: entry.template,
  });
};
