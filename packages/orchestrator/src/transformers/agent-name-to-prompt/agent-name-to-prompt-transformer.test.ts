import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { AgentPromptNameStub } from '../../contracts/agent-prompt-name/agent-prompt-name.stub';
import { DisciplineStub } from '../../contracts/discipline/discipline.stub';
import { agentPromptClassificationStatics } from '../../statics/agent-prompt-classification/agent-prompt-classification-statics';
import { chaoswhispererGapMinionStatics } from '../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { operatorPromptStatics } from '../../statics/operator-prompt/operator-prompt-statics';
import { plannerMinionStatics } from '../../statics/planner-minion/planner-minion-statics';
import { reviewerMinionStatics } from '../../statics/reviewer-minion/reviewer-minion-statics';
import { roleToDisciplineStatics } from '../../statics/role-to-discipline/role-to-discipline-statics';
import { roleToModelStatics } from '../../statics/role-to-model/role-to-model-statics';
import { spiritmenderPromptStatics } from '../../statics/spiritmender-prompt/spiritmender-prompt-statics';
import { warpgatePromptStatics } from '../../statics/warpgate-prompt/warpgate-prompt-statics';
import { workerMinionStatics } from '../../statics/worker-minion/worker-minion-statics';
import { disciplineToPackTransformer } from '../discipline-to-pack/discipline-to-pack-transformer';
import { agentNameToPromptTransformer } from './agent-name-to-prompt-transformer';

type OrchestratorRole = keyof typeof roleToDisciplineStatics;

// The five operation-owning roles and the discipline each derives, read off the role map rather
// than listed here — a role added there and forgotten in a hand-written case list would go
// untested precisely when its wiring is new.
const OPERATOR_ROLE_CASES = (
  Object.keys(roleToDisciplineStatics) as readonly OrchestratorRole[]
).map((role) => [role, roleToDisciplineStatics[role]] as const);

// Every discipline a generic minion can be summoned with, derived from the same map.
const EVERY_DISPATCHABLE_DISCIPLINE = Object.values(roleToDisciplineStatics);

// The three minions parameterized by a discipline — everything in `minionNames` except the
// spec-phase gap minion, which is summoned before any operation item exists.
const GENERIC_MINION_NAMES = agentPromptClassificationStatics.minionNames.filter(
  (minionName) => minionName !== 'chaoswhisperer-gap-minion',
);

const GENERIC_MINION_DISCIPLINE_CASES = GENERIC_MINION_NAMES.flatMap((minionName) =>
  EVERY_DISPATCHABLE_DISCIPLINE.map((discipline) => [minionName, discipline] as const),
);

describe('agentNameToPromptTransformer', () => {
  describe('the five operation-owning roles share one template, parameterized by their discipline', () => {
    it.each(OPERATOR_ROLE_CASES)(
      'VALID: {agent: %s} => returns the operator template with the %s pack interpolated, on sonnet',
      (role, discipline) => {
        const agent = AgentPromptNameStub({ value: role });

        const result = agentNameToPromptTransformer({ agent });

        expect(result).toStrictEqual({
          name: role,
          // An operator opens no source file and renders no verdict — the expensive reasoning is in
          // its minions, whose models are fixed per minion below. Read from `roleToModelStatics`
          // rather than restated, because that map is what the CLI `--model` flag resolves through
          // at spawn time: a literal here could report one model while the child ran another.
          model: roleToModelStatics[role],
          prompt: operatorPromptStatics.prompt.template
            .replace(
              '$DISCIPLINE',
              () =>
                disciplineToPackTransformer({ discipline: DisciplineStub({ value: discipline }) })
                  .operatorMarkdown,
            )
            // `$MY_DISCIPLINE` substitutes EVERYWHERE, not once: the template quotes the bare
            // discipline id into the `get-agent-prompt` call its minions must make AND into the
            // header every minion brief opens with.
            .split('$MY_DISCIPLINE')
            .join(discipline),
        });
      },
    );

    it.each(OPERATOR_ROLE_CASES)(
      'VALID: {agent: %s} => served prompt carries no unresolved $DISCIPLINE or $MY_DISCIPLINE token',
      (role) => {
        const agent = AgentPromptNameStub({ value: role });

        const { prompt } = agentNameToPromptTransformer({ agent });

        expect({
          discipline: prompt.split('$DISCIPLINE').length - 1,
          myDiscipline: prompt.split('$MY_DISCIPLINE').length - 1,
        }).toStrictEqual({ discipline: 0, myDiscipline: 0 });
      },
    );

    // The round-trip the pipeline actually runs: the operator reads a discipline id out of the
    // prompt it was served and hands that exact string to `get-agent-prompt` for each of its three
    // minions. If the id the template emits is not one those minions accept, EVERY dispatch on the
    // happy path throws at the minion's first action.
    it.each(OPERATOR_ROLE_CASES)(
      'VALID: {agent: %s} => the discipline id its prompt tells minions to send is one all three minions accept',
      (role, discipline) => {
        const { prompt } = agentNameToPromptTransformer({
          agent: AgentPromptNameStub({ value: role }),
        });
        const emitted = prompt.replace(/^[\s\S]*?discipline: '/u, '').replace(/'[\s\S]*$/u, '');

        expect({
          emitted,
          servedToEveryMinion: GENERIC_MINION_NAMES.map(
            (minionName) =>
              agentNameToPromptTransformer({
                agent: AgentPromptNameStub({ value: minionName }),
                discipline: DisciplineStub({ value: discipline }),
              }).name,
          ),
        }).toStrictEqual({
          emitted: discipline,
          servedToEveryMinion: ['planner-minion', 'worker-minion', 'reviewer-minion'],
        });
      },
    );

    // The per-minion model table in the template is where the operator reads the model it passes to
    // the Agent tool, and this switch is the registry it has to agree with. Drift between the two
    // IS the defect: one blanket `sonnet` here ran the planner and the reviewer off-model. The
    // needle is a whole table ROW, so a row that loses its model cell fails here rather than
    // matching on the minion name alone.
    it.each(OPERATOR_ROLE_CASES)(
      'VALID: {agent: %s} => the per-minion models its prompt names match the models this transformer returns',
      (role) => {
        const { prompt } = agentNameToPromptTransformer({
          agent: AgentPromptNameStub({ value: role }),
        });

        expect(
          GENERIC_MINION_NAMES.map((minionName) => {
            const { model } = agentNameToPromptTransformer({
              agent: AgentPromptNameStub({ value: minionName }),
              discipline: DisciplineStub({ value: 'implementation' }),
            });
            return [
              minionName,
              model,
              prompt.includes(`| \`${minionName}\` | \`model: "${model}"\` |`),
            ];
          }),
        ).toStrictEqual([
          ['planner-minion', 'opus', true],
          ['worker-minion', 'sonnet', true],
          ['reviewer-minion', 'opus', true],
        ]);
      },
    );

    it.each(OPERATOR_ROLE_CASES)(
      'VALID: {agent: %s} => served prompt still carries exactly one $ARGUMENTS for the operation context',
      (role) => {
        const agent = AgentPromptNameStub({ value: role });

        const { prompt } = agentNameToPromptTransformer({ agent });

        expect(prompt.split('$ARGUMENTS').length - 1).toBe(1);
      },
    );
  });

  describe('the three generic minions are parameterized by the discipline their parent hands them', () => {
    it('VALID: {agent: "planner-minion", discipline: implementation} => returns the planner template with the implementation planner block, on opus', () => {
      const agent = AgentPromptNameStub({ value: 'planner-minion' });

      const result = agentNameToPromptTransformer({
        agent,
        discipline: DisciplineStub({ value: 'implementation' }),
      });

      expect(result).toStrictEqual({
        name: 'planner-minion',
        model: 'opus',
        prompt: plannerMinionStatics.prompt.template.replace(
          '$DISCIPLINE',
          () =>
            disciplineToPackTransformer({ discipline: DisciplineStub({ value: 'implementation' }) })
              .plannerMarkdown,
        ),
      });
    });

    it('VALID: {agent: "worker-minion", discipline: below-browser} => returns the worker template with the below-browser worker block, on sonnet', () => {
      const agent = AgentPromptNameStub({ value: 'worker-minion' });

      const result = agentNameToPromptTransformer({
        agent,
        discipline: DisciplineStub({ value: 'below-browser' }),
      });

      expect(result).toStrictEqual({
        name: 'worker-minion',
        model: 'sonnet',
        prompt: workerMinionStatics.prompt.template.replace(
          '$DISCIPLINE',
          () =>
            disciplineToPackTransformer({ discipline: DisciplineStub({ value: 'below-browser' }) })
              .workerMarkdown,
        ),
      });
    });

    it('VALID: {agent: "reviewer-minion", discipline: manual-qa} => returns the reviewer template with the manual-qa reviewer block, on opus', () => {
      const agent = AgentPromptNameStub({ value: 'reviewer-minion' });

      const result = agentNameToPromptTransformer({
        agent,
        discipline: DisciplineStub({ value: 'manual-qa' }),
      });

      expect(result).toStrictEqual({
        name: 'reviewer-minion',
        model: 'opus',
        prompt: reviewerMinionStatics.prompt.template.replace(
          '$DISCIPLINE',
          () =>
            disciplineToPackTransformer({ discipline: DisciplineStub({ value: 'manual-qa' }) })
              .reviewerMarkdown,
        ),
      });
    });

    it.each(GENERIC_MINION_DISCIPLINE_CASES)(
      'VALID: {agent: %s, discipline: %s} => served prompt carries no unresolved $DISCIPLINE token',
      (minionName, discipline) => {
        const { prompt } = agentNameToPromptTransformer({
          agent: AgentPromptNameStub({ value: minionName }),
          discipline: DisciplineStub({ value: discipline }),
        });

        expect(prompt.split('$DISCIPLINE').length - 1).toBe(0);
      },
    );

    // A minion served without its discipline would run with the literal token in place of every
    // instruction it has — a silent no-op session, which is why this throws instead of degrading.
    it.each(GENERIC_MINION_NAMES)(
      'ERROR: {agent: %s, no discipline} => throws naming every valid discipline',
      (minionName) => {
        expect(() =>
          agentNameToPromptTransformer({ agent: AgentPromptNameStub({ value: minionName }) }),
        ).toThrow(
          /must be summoned with a discipline — one of: implementation \| bug-repro \| below-browser \| browser-e2e \| manual-qa/u,
        );
      },
    );
  });

  describe('names served without a discipline at all', () => {
    it('VALID: {agent: "chaoswhisperer-gap-minion"} => returns the spec-phase gap minion prompt data', () => {
      const agent = AgentPromptNameStub({ value: 'chaoswhisperer-gap-minion' });

      const result = agentNameToPromptTransformer({ agent });

      expect(result).toStrictEqual({
        name: 'chaoswhisperer-gap-minion',
        model: 'sonnet',
        prompt: chaoswhispererGapMinionStatics.prompt.template,
      });
    });

    it('VALID: {agent: "spiritmender"} => returns spiritmender prompt data on sonnet', () => {
      const agent = AgentPromptNameStub({ value: 'spiritmender' });

      const result = agentNameToPromptTransformer({ agent });

      expect(result).toStrictEqual({
        name: 'spiritmender',
        model: 'sonnet',
        prompt: spiritmenderPromptStatics.prompt.template,
      });
    });

    it('VALID: {agent: "warpgate"} => returns warpgate prompt data on opus', () => {
      const agent = AgentPromptNameStub({ value: 'warpgate' });

      const result = agentNameToPromptTransformer({ agent });

      expect(result).toStrictEqual({
        name: 'warpgate',
        model: 'opus',
        prompt: warpgatePromptStatics.prompt.template,
      });
    });
  });

  // A minion is served by agentPromptGetBroker's minion branch: this template plus a one-line
  // `Quest ID:` substitution. Over mcpToolResultStatics.maxVerbatimChars the MCP layer spills the
  // result to a file and hands the agent an error stub instead of its instructions.
  describe('MCP tool-result budget for the minion-fetch path', () => {
    it.each(GENERIC_MINION_DISCIPLINE_CASES)(
      'VALID: {agent: %s, discipline: %s} => served MCP block stays within the verbatim budget',
      (minionName, discipline) => {
        const { name, model, prompt } = agentNameToPromptTransformer({
          agent: AgentPromptNameStub({ value: minionName }),
          discipline: DisciplineStub({ value: discipline }),
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

  describe('retired names are not valid agent prompt names', () => {
    it.each([
      'blightscout',
      'codeweaver-piece-minion',
      'flowrider-authoring-minion',
      'flowrider-coverage-minion',
      'siegemaster-walker-minion',
      'siegemaster-test-audit-minion',
      'pathseeker',
    ])('INVALID: {value: "%s"} => throws parsing the agent prompt name', (value) => {
      expect(() => {
        AgentPromptNameStub({ value });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
