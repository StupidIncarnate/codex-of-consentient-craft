import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { agentPromptClassificationStatics } from '../../statics/agent-prompt-classification/agent-prompt-classification-statics';
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
import { agentNameToPromptTransformer } from './agent-name-to-prompt-transformer';

type PromptName = Parameters<typeof agentNameToPromptTransformer>[0]['agent'];

// What each served name is supposed to come back with, stated ONCE here and read live off the
// statics rather than copied — a prompt edited in its own file has to keep passing without this
// file being touched, or the assertion pins a stale copy instead of the served text.
//
// `satisfies Record<PromptName, unknown>` is the same exhaustiveness the transformer's own table
// carries: a name added to `agentPromptClassificationStatics.promptNames` with no entry here fails
// to compile, so the case list below can never quietly skip a new prompt.
//
// MODELS. The seven ROLE names read `roleToModelStatics` instead of restating a literal, because
// that map is what the CLI `--model` flag resolves through at spawn time — `get-agent-prompt` only
// REPORTS this value, and a literal would let the reported model drift from the one the child
// actually ran. The minions have no such map, so their models are stated: planner opus, worker
// sonnet, reviewer opus. Downgrading a reviewer is the expensive mistake — it is the only session
// on a round that verifies anything.
const EXPECTED_BY_NAME = {
  'chaoswhisperer-gap-minion': {
    model: 'sonnet',
    prompt: chaoswhispererGapMinionStatics.prompt.template,
  },

  codeweaver: {
    model: roleToModelStatics.codeweaver,
    prompt: codeweaverPromptStatics.prompt.template,
  },
  'codeweaver-planner-minion': {
    model: 'opus',
    prompt: codeweaverPlannerMinionStatics.prompt.template,
  },
  'codeweaver-worker-minion': {
    model: 'sonnet',
    prompt: codeweaverWorkerMinionStatics.prompt.template,
  },
  'codeweaver-reviewer-minion': {
    model: 'opus',
    prompt: codeweaverReviewerMinionStatics.prompt.template,
  },

  pesteater: {
    model: roleToModelStatics.pesteater,
    prompt: pesteaterPromptStatics.prompt.template,
  },
  'pesteater-planner-minion': {
    model: 'opus',
    prompt: pesteaterPlannerMinionStatics.prompt.template,
  },
  'pesteater-worker-minion': {
    model: 'sonnet',
    prompt: pesteaterWorkerMinionStatics.prompt.template,
  },
  'pesteater-reviewer-minion': {
    model: 'opus',
    prompt: pesteaterReviewerMinionStatics.prompt.template,
  },

  flowrider: {
    model: roleToModelStatics.flowrider,
    prompt: flowriderPromptStatics.prompt.template,
  },
  'flowrider-planner-minion': {
    model: 'opus',
    prompt: flowriderPlannerMinionStatics.prompt.template,
  },
  'flowrider-worker-minion': {
    model: 'sonnet',
    prompt: flowriderWorkerMinionStatics.prompt.template,
  },
  'flowrider-reviewer-minion': {
    model: 'opus',
    prompt: flowriderReviewerMinionStatics.prompt.template,
  },

  groundstomper: {
    model: roleToModelStatics.groundstomper,
    prompt: groundstomperPromptStatics.prompt.template,
  },
  'groundstomper-planner-minion': {
    model: 'opus',
    prompt: groundstomperPlannerMinionStatics.prompt.template,
  },
  'groundstomper-worker-minion': {
    model: 'sonnet',
    prompt: groundstomperWorkerMinionStatics.prompt.template,
  },
  'groundstomper-reviewer-minion': {
    model: 'opus',
    prompt: groundstomperReviewerMinionStatics.prompt.template,
  },

  siegemaster: {
    model: roleToModelStatics.siegemaster,
    prompt: siegemasterPromptStatics.prompt.template,
  },
  'siegemaster-planner-minion': {
    model: 'opus',
    prompt: siegemasterPlannerMinionStatics.prompt.template,
  },
  'siegemaster-worker-minion': {
    model: 'sonnet',
    prompt: siegemasterWorkerMinionStatics.prompt.template,
  },
  'siegemaster-reviewer-minion': {
    model: 'opus',
    prompt: siegemasterReviewerMinionStatics.prompt.template,
  },

  spiritmender: {
    model: roleToModelStatics.spiritmender,
    prompt: spiritmenderPromptStatics.prompt.template,
  },
  warpgate: {
    model: roleToModelStatics.warpgate,
    prompt: warpgatePromptStatics.prompt.template,
  },
} as const satisfies Record<PromptName, unknown>;

// The case list is DERIVED from the name list the contract itself is built from, so a twenty-fourth
// prompt is covered the day it is added rather than the day someone remembers this file.
const EVERY_PROMPT_CASE = agentPromptClassificationStatics.promptNames.map(
  (name) => [name, EXPECTED_BY_NAME[name].model, EXPECTED_BY_NAME[name].prompt] as const,
);

describe('agentNameToPromptTransformer', () => {
  describe('every served name resolves to the prompt file that carries its own name', () => {
    it.each(EVERY_PROMPT_CASE)(
      'VALID: {agent: %s} => returns that name own template, on that name own model',
      (name, model, prompt) => {
        expect(agentNameToPromptTransformer({ agent: name })).toStrictEqual({
          name,
          model,
          prompt,
        });
      },
    );
  });

  describe('nothing is interpolated on the way out', () => {
    // All twenty-three templates carry exactly one `$ARGUMENTS`, where the caller that owns the
    // operation context substitutes. For a ROLE that caller is `workItemToPromptTransformer`; for a
    // minion — `chaoswhisperer-gap-minion` included — it is `agentPromptGetBroker`'s minion branch,
    // which substitutes a bare `Quest ID:` line.
    it.each(agentPromptClassificationStatics.promptNames)(
      'VALID: {agent: %s} => served prompt still carries exactly one $ARGUMENTS for its caller',
      (name) => {
        const { prompt } = agentNameToPromptTransformer({ agent: name });

        expect(prompt.split('$ARGUMENTS').length - 1).toBe(1);
      },
    );

    // Every prompt is one file holding its own text now. A `$DISCIPLINE` or `$MY_DISCIPLINE` left
    // in any served prompt would be a token nothing substitutes any more — an agent handed the
    // literal string where its instructions used to be.
    it.each(agentPromptClassificationStatics.promptNames)(
      'VALID: {agent: %s} => served prompt carries no $DISCIPLINE or $MY_DISCIPLINE token',
      (name) => {
        const { prompt } = agentNameToPromptTransformer({ agent: name });

        expect({
          discipline: prompt.split('$DISCIPLINE').length - 1,
          myDiscipline: prompt.split('$MY_DISCIPLINE').length - 1,
        }).toStrictEqual({ discipline: 0, myDiscipline: 0 });
      },
    );
  });

  // A minion is served by agentPromptGetBroker's minion branch: this result, with one `Quest ID:`
  // line substituted in. Over `mcpToolResultStatics.maxVerbatimChars` the MCP layer spills the
  // result to a file and hands the agent an error stub instead of its instructions — a silent
  // dispatch failure, since the session starts holding a path rather than a method.
  describe('MCP tool-result budget for the minion-fetch path', () => {
    it.each(agentPromptClassificationStatics.minionNames)(
      'VALID: {agent: %s} => served MCP block stays within the verbatim budget',
      (minionName) => {
        const { name, model, prompt } = agentNameToPromptTransformer({ agent: minionName });

        const servedBlock = JSON.stringify(
          { name, model, prompt: prompt.replace('$ARGUMENTS', () => 'Quest ID: my-quest') },
          null,
          mcpToolResultStatics.jsonIndentSpaces,
        );

        expect(servedBlock.length).toBeLessThanOrEqual(mcpToolResultStatics.maxVerbatimChars);
      },
    );
  });
});
