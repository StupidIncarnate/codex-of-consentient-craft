import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { AgentPromptNameStub } from '../../contracts/agent-prompt-name/agent-prompt-name.stub';
import { agentPromptClassificationStatics } from '../../statics/agent-prompt-classification/agent-prompt-classification-statics';
import { chaoswhispererGapMinionStatics } from '../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { codeweaverPlannerStatics } from '../../statics/codeweaver-planner/codeweaver-planner-statics';
import { codeweaverReviewerStatics } from '../../statics/codeweaver-reviewer/codeweaver-reviewer-statics';
import { codeweaverWorkerStatics } from '../../statics/codeweaver-worker/codeweaver-worker-statics';
import { flowriderPlannerStatics } from '../../statics/flowrider-planner/flowrider-planner-statics';
import { flowriderReviewerStatics } from '../../statics/flowrider-reviewer/flowrider-reviewer-statics';
import { flowriderWorkerStatics } from '../../statics/flowrider-worker/flowrider-worker-statics';
import { recipeMakerStatics } from '../../statics/recipe-maker/recipe-maker-statics';
import { roleToModelStatics } from '../../statics/role-to-model/role-to-model-statics';
import { siegeAdversarialFixerStatics } from '../../statics/siege-adversarial-fixer/siege-adversarial-fixer-statics';
import { siegeAdversarialWalkerStatics } from '../../statics/siege-adversarial-walker/siege-adversarial-walker-statics';
import { siegeHappyFixerStatics } from '../../statics/siege-happy-fixer/siege-happy-fixer-statics';
import { siegeHappyWalkerStatics } from '../../statics/siege-happy-walker/siege-happy-walker-statics';
import { siegemasterReaderStatics } from '../../statics/siegemaster-reader/siegemaster-reader-statics';
import { siegePlannerStatics } from '../../statics/siege-planner/siege-planner-statics';
import { spiritmenderPromptStatics } from '../../statics/spiritmender-prompt/spiritmender-prompt-statics';
import { warpgatePromptStatics } from '../../statics/warpgate-prompt/warpgate-prompt-statics';
import { agentNameToPromptTransformer } from './agent-name-to-prompt-transformer';

const UNSERVED_PROMPT_NAMES = ['codeweaver', 'flowrider', 'siegemaster'] as const;

type UnservedPromptName = typeof UNSERVED_PROMPT_NAMES extends readonly (infer U)[] ? U : never;

// The literal union of today's served roster, pulled out of the tuple type without an indexed-access
// `[number]` (banned by `@dungeonmaster/ban-primitives` outside a function parameter).
type PromptName = Exclude<
  typeof agentPromptClassificationStatics.promptNames extends readonly (infer U)[] ? U : never,
  UnservedPromptName
>;

const isServedPromptName = (
  name: typeof agentPromptClassificationStatics.promptNames extends readonly (infer U)[]
    ? U
    : never,
): name is PromptName => !UNSERVED_PROMPT_NAMES.some((unserved) => unserved === name);

const SERVED_PROMPT_NAMES = agentPromptClassificationStatics.promptNames.filter(isServedPromptName);

// What each served name is supposed to come back with, stated ONCE here and read live off the
// statics rather than copied — a prompt edited in its own file has to keep passing without this
// file being touched, or the assertion pins a stale copy instead of the served text.
//
// `satisfies Record<PromptName, unknown>` is THIS FILE's own exhaustiveness check, kept separate
// from the transformer's now that `agentPromptNameContract` is an open branded string:
// `AGENT_PROMPTS`'s own `satisfies Record<AgentPromptName, unknown>` no longer forces every roster
// name to carry a row — a non-literal branded string has no finite key set to check against, so a
// name with no row now fails only at DISPATCH (the throw exercised below). Deriving `PromptName`
// from the STATICS roster instead of from the contract keeps THIS list exhaustive regardless: a name
// added to `agentPromptClassificationStatics.promptNames` with no entry here still fails to compile.
//
// MODELS. The ROLE names read `roleToModelStatics` instead of restating a literal so a row here
// still names a real value if anything reads it directly — this table's `model` is what
// `agentNameToPromptTransformer` itself returns, exercised for its own sake below, but for a role
// or step prompt the DISPATCHED model and the model `get-agent-prompt` REPORTS both resolve off the
// work item's own `agentFlowStatics` step node instead (`workItemToPromptTransformer`), not off
// this table. The minions have no such map, so their models are stated: all sonnet, because a
// minion arrives with its scope already narrowed by the brief that summoned it.
const EXPECTED_BY_NAME = {
  'chaoswhisperer-gap-minion': {
    model: 'sonnet',
    prompt: chaoswhispererGapMinionStatics.prompt.template,
  },

  'codeweaver-planner': {
    model: roleToModelStatics.codeweaver,
    prompt: codeweaverPlannerStatics.prompt.template,
  },
  'codeweaver-worker': {
    model: roleToModelStatics.codeweaver,
    prompt: codeweaverWorkerStatics.prompt.template,
  },
  'codeweaver-reviewer': {
    model: 'sonnet',
    prompt: codeweaverReviewerStatics.prompt.template,
  },

  'flowrider-planner': {
    model: roleToModelStatics.flowrider,
    prompt: flowriderPlannerStatics.prompt.template,
  },
  'flowrider-worker': {
    model: roleToModelStatics.flowrider,
    prompt: flowriderWorkerStatics.prompt.template,
  },
  'flowrider-reviewer': {
    model: 'sonnet',
    prompt: flowriderReviewerStatics.prompt.template,
  },

  'recipe-maker': {
    model: 'opus',
    prompt: recipeMakerStatics.prompt.template,
  },

  'siege-adversarial-fixer': {
    model: 'sonnet',
    prompt: siegeAdversarialFixerStatics.prompt.template,
  },
  'siege-adversarial-walker': {
    model: 'sonnet',
    prompt: siegeAdversarialWalkerStatics.prompt.template,
  },
  'siege-happy-fixer': {
    model: 'sonnet',
    prompt: siegeHappyFixerStatics.prompt.template,
  },
  'siege-happy-walker': {
    model: 'sonnet',
    prompt: siegeHappyWalkerStatics.prompt.template,
  },
  'siege-planner': {
    model: roleToModelStatics.siegemaster,
    prompt: siegePlannerStatics.prompt.template,
  },
  'siegemaster-reader': {
    model: 'sonnet',
    prompt: siegemasterReaderStatics.prompt.template,
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

// The case list is DERIVED from the name list the contract's roster carries, so an eleventh prompt
// is covered the day it is added rather than the day someone remembers this file.
const EVERY_PROMPT_CASE = SERVED_PROMPT_NAMES.map(
  (name) => [name, EXPECTED_BY_NAME[name].model, EXPECTED_BY_NAME[name].prompt] as const,
);

describe('agentNameToPromptTransformer', () => {
  describe('every served name resolves to the prompt file that carries its own name', () => {
    it.each(EVERY_PROMPT_CASE)(
      'VALID: {agent: %s} => returns that name own template, on that name own model',
      (name, model, prompt) => {
        expect(
          agentNameToPromptTransformer({ agent: AgentPromptNameStub({ value: name }) }),
        ).toStrictEqual({
          name,
          model,
          prompt,
        });
      },
    );
  });

  describe('nothing is interpolated on the way out', () => {
    // Every template carries exactly one `$ARGUMENTS`, where the caller that owns the operation
    // context substitutes. For a ROLE that caller is `workItemToPromptTransformer`; for a minion —
    // `chaoswhisperer-gap-minion` included — it is `agentPromptGetBroker`'s minion branch, which
    // substitutes a bare `Quest ID:` line.
    it.each(SERVED_PROMPT_NAMES)(
      'VALID: {agent: %s} => served prompt still carries exactly one $ARGUMENTS for its caller',
      (name) => {
        const { prompt } = agentNameToPromptTransformer({
          agent: AgentPromptNameStub({ value: name }),
        });

        expect(prompt.split('$ARGUMENTS').length - 1).toBe(1);
      },
    );

    // Every prompt is one file holding its own text. A `$DISCIPLINE` or `$MY_DISCIPLINE` left in
    // any served prompt would be a token nothing substitutes — an agent handed the literal string
    // where its instructions belong.
    it.each(SERVED_PROMPT_NAMES)(
      'VALID: {agent: %s} => served prompt carries no $DISCIPLINE or $MY_DISCIPLINE token',
      (name) => {
        const { prompt } = agentNameToPromptTransformer({
          agent: AgentPromptNameStub({ value: name }),
        });

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
    const servedMinionNames = agentPromptClassificationStatics.minionNames.filter((name) =>
      SERVED_PROMPT_NAMES.some((served) => served === name),
    );

    it.each(servedMinionNames)(
      'VALID: {agent: %s} => served MCP block stays within the verbatim budget',
      (minionName) => {
        const { name, model, prompt } = agentNameToPromptTransformer({
          agent: AgentPromptNameStub({ value: minionName }),
        });

        const servedBlock = JSON.stringify(
          { name, model, prompt: prompt.replace('$ARGUMENTS', () => 'Quest ID: my-quest') },
          null,
          mcpToolResultStatics.jsonIndentSpaces,
        );

        expect(servedBlock.length).toBeLessThanOrEqual(mcpToolResultStatics.maxVerbatimChars);
      },
    );
  });

  // The contract no longer closes the set (see agent-prompt-name-contract.ts), so a name with no
  // row in AGENT_PROMPTS reaches this transformer instead of dying at parse time. This is the one
  // place that still refuses it — loudly, by name, rather than dispatching a session against
  // `undefined.model`.
  describe('an unknown prompt name is refused at dispatch, loudly and by name', () => {
    it.each(UNSERVED_PROMPT_NAMES)(
      'ERROR: {agent: %s} => throws because prompt was deleted and is not served',
      (unservedName) => {
        expect(() => {
          agentNameToPromptTransformer({
            agent: AgentPromptNameStub({ value: unservedName }),
          });
        }).toThrow(
          `Unknown agent prompt name: '${unservedName}'. No prompt is registered for it in AGENT_PROMPTS — check agentPromptClassificationStatics.promptNames and this table still agree.`,
        );
      },
    );

    it("ERROR: {agent: 'a-prompt-nobody-declared'} => throws naming the unknown name", () => {
      expect(() => {
        agentNameToPromptTransformer({
          agent: AgentPromptNameStub({ value: 'a-prompt-nobody-declared' }),
        });
      }).toThrow(
        "Unknown agent prompt name: 'a-prompt-nobody-declared'. No prompt is registered for it in AGENT_PROMPTS — check agentPromptClassificationStatics.promptNames and this table still agree.",
      );
    });
  });

  // A name landing in NEITHER `SERVED_PROMPT_NAMES` nor `UNSERVED_PROMPT_NAMES` is exactly the
  // drift that let a dangling roster entry go unnoticed: added to `promptNames`, never given a row
  // in `AGENT_PROMPTS`, and never declared as a documented retired name either — silent until the
  // day something dispatches it. This closes the gap the two lists above leave open between them.
  describe('every name in promptNames is accounted for', () => {
    it('VALID: {promptNames} => each one is served or is a documented retired name, with none left over', () => {
      const accountedFor = new Set([...SERVED_PROMPT_NAMES, ...UNSERVED_PROMPT_NAMES]);
      const unaccountedNames = agentPromptClassificationStatics.promptNames.filter(
        (name) => !accountedFor.has(name),
      );

      expect(unaccountedNames).toStrictEqual([]);
    });
  });
});
