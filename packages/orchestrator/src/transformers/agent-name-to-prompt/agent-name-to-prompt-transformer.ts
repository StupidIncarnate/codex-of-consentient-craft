/**
 * PURPOSE: Resolves an agent prompt name to the result `get-agent-prompt` serves. Reach for this
 * when you hold a NAME; reach for `roleToPromptTemplateTransformer` when you hold an `AgentRole` and
 * want only the template text, because that one's exhaustiveness is keyed on the narrower role union.
 *
 * USAGE:
 * agentNameToPromptTransformer({ agent: agentPromptNameContract.parse('codeweaver') });
 * // Returns { name: 'codeweaver', model: 'sonnet', prompt: '...' } — `$ARGUMENTS` still
 * // unsubstituted, for the caller that owns the operation context.
 *
 * NOTHING IS INTERPOLATED HERE ANY MORE. Every prompt is one file holding its own text, so this
 * transformer looks a name up and returns it. Its predecessor was the ONE place `$DISCIPLINE` and
 * `$MY_DISCIPLINE` were substituted — a generic template plus one of five packs — and every caller
 * downstream had to be trusted not to hand an agent the literal token. There is no token left.
 *
 * A TABLE RATHER THAN A SWITCH, and the `satisfies` is what keeps that safe. `Record<AgentPromptName,
 * unknown>` is exhaustive over the same union a `never` default checked: a name added to
 * `agentPromptClassificationStatics.promptNames` without a prompt behind it fails to compile here,
 * and a key that is not a valid name fails the object literal's excess-property check. `unknown` is
 * the value type on purpose — the branded contract fields would need raw `string` to describe, and
 * `as const` preserves each entry's real type for the reads below regardless of what `satisfies`
 * compares against. What the table buys is twenty-three entries reading as twenty-three lines.
 *
 * MODELS ARE READ, NEVER LITERAL, for the roles. `roleToModelStatics` is what the CLI `--model` flag
 * resolves through — `buildSpawnInstructionLayerBroker` sets no model, so every real dispatch falls
 * through to it — while the value here is only what `get-agent-prompt` REPORTS. A literal would let
 * the two disagree in the direction nothing surfaces. Minion models have no such map and are stated
 * here: planner and reviewer on opus, worker on sonnet. Downgrading a reviewer is the expensive
 * mistake, because it is the only session on a round that verifies anything.
 */

import { agentPromptResultContract, type AgentPromptResult } from '@dungeonmaster/shared/contracts';

import type { AgentPromptName } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import { chaoswhispererGapMinionStatics } from '../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { codeweaverPlannerMinionStatics } from '../../statics/codeweaver-planner-minion/codeweaver-planner-minion-statics';
import { codeweaverPromptStatics } from '../../statics/codeweaver-prompt/codeweaver-prompt-statics';
import { codeweaverReviewerMinionStatics } from '../../statics/codeweaver-reviewer-minion/codeweaver-reviewer-minion-statics';
import { codeweaverWorkerMinionStatics } from '../../statics/codeweaver-worker-minion/codeweaver-worker-minion-statics';
import { flowriderPlannerMinionStatics } from '../../statics/flowrider-planner-minion/flowrider-planner-minion-statics';
import { flowriderPromptStatics } from '../../statics/flowrider-prompt/flowrider-prompt-statics';
import { flowriderReviewerMinionStatics } from '../../statics/flowrider-reviewer-minion/flowrider-reviewer-minion-statics';
import { flowriderWorkerMinionStatics } from '../../statics/flowrider-worker-minion/flowrider-worker-minion-statics';
import { groundstomperPlannerMinionStatics } from '../../statics/groundstomper-planner-minion/groundstomper-planner-minion-statics';
import { groundstomperPromptStatics } from '../../statics/groundstomper-prompt/groundstomper-prompt-statics';
import { groundstomperReviewerMinionStatics } from '../../statics/groundstomper-reviewer-minion/groundstomper-reviewer-minion-statics';
import { groundstomperWorkerMinionStatics } from '../../statics/groundstomper-worker-minion/groundstomper-worker-minion-statics';
import { pesteaterPlannerMinionStatics } from '../../statics/pesteater-planner-minion/pesteater-planner-minion-statics';
import { pesteaterPromptStatics } from '../../statics/pesteater-prompt/pesteater-prompt-statics';
import { pesteaterReviewerMinionStatics } from '../../statics/pesteater-reviewer-minion/pesteater-reviewer-minion-statics';
import { pesteaterWorkerMinionStatics } from '../../statics/pesteater-worker-minion/pesteater-worker-minion-statics';
import { roleToModelStatics } from '../../statics/role-to-model/role-to-model-statics';
import { siegemasterPlannerMinionStatics } from '../../statics/siegemaster-planner-minion/siegemaster-planner-minion-statics';
import { siegemasterPromptStatics } from '../../statics/siegemaster-prompt/siegemaster-prompt-statics';
import { siegemasterReviewerMinionStatics } from '../../statics/siegemaster-reviewer-minion/siegemaster-reviewer-minion-statics';
import { siegemasterWorkerMinionStatics } from '../../statics/siegemaster-worker-minion/siegemaster-worker-minion-statics';
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
  'codeweaver-planner-minion': {
    model: 'opus',
    template: codeweaverPlannerMinionStatics.prompt.template,
  },
  'codeweaver-worker-minion': {
    model: 'sonnet',
    template: codeweaverWorkerMinionStatics.prompt.template,
  },
  'codeweaver-reviewer-minion': {
    model: 'opus',
    template: codeweaverReviewerMinionStatics.prompt.template,
  },

  pesteater: {
    model: roleToModelStatics.pesteater,
    template: pesteaterPromptStatics.prompt.template,
  },
  'pesteater-planner-minion': {
    model: 'opus',
    template: pesteaterPlannerMinionStatics.prompt.template,
  },
  'pesteater-worker-minion': {
    model: 'sonnet',
    template: pesteaterWorkerMinionStatics.prompt.template,
  },
  'pesteater-reviewer-minion': {
    model: 'opus',
    template: pesteaterReviewerMinionStatics.prompt.template,
  },

  flowrider: {
    model: roleToModelStatics.flowrider,
    template: flowriderPromptStatics.prompt.template,
  },
  'flowrider-planner-minion': {
    model: 'opus',
    template: flowriderPlannerMinionStatics.prompt.template,
  },
  'flowrider-worker-minion': {
    model: 'sonnet',
    template: flowriderWorkerMinionStatics.prompt.template,
  },
  'flowrider-reviewer-minion': {
    model: 'opus',
    template: flowriderReviewerMinionStatics.prompt.template,
  },

  groundstomper: {
    model: roleToModelStatics.groundstomper,
    template: groundstomperPromptStatics.prompt.template,
  },
  'groundstomper-planner-minion': {
    model: 'opus',
    template: groundstomperPlannerMinionStatics.prompt.template,
  },
  'groundstomper-worker-minion': {
    model: 'sonnet',
    template: groundstomperWorkerMinionStatics.prompt.template,
  },
  'groundstomper-reviewer-minion': {
    model: 'opus',
    template: groundstomperReviewerMinionStatics.prompt.template,
  },

  siegemaster: {
    model: roleToModelStatics.siegemaster,
    template: siegemasterPromptStatics.prompt.template,
  },
  'siegemaster-planner-minion': {
    model: 'opus',
    template: siegemasterPlannerMinionStatics.prompt.template,
  },
  'siegemaster-worker-minion': {
    model: 'sonnet',
    template: siegemasterWorkerMinionStatics.prompt.template,
  },
  'siegemaster-reviewer-minion': {
    model: 'opus',
    template: siegemasterReviewerMinionStatics.prompt.template,
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
