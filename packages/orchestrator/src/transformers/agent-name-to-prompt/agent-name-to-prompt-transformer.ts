/**
 * PURPOSE: Resolves an agent prompt name to the prompt result `get-agent-prompt` serves — and is
 * the ONE place `$DISCIPLINE` (and, for a role, `$MY_DISCIPLINE`) is substituted, so no caller
 * downstream can hand an agent the literal token. An operator ROLE derives its own discipline
 * from `roleToDisciplineStatics`; the three generic minions have none of their own and must be
 * given one by the parent that summons them — which is why a role's served prompt has to carry the
 * discipline ID as well as the pack.
 *
 * USAGE:
 * agentNameToPromptTransformer({ agent: agentPromptNameContract.parse('codeweaver') });
 * // Returns { name: 'codeweaver', model: 'sonnet', prompt: '...' } — $DISCIPLINE resolved,
 * // $ARGUMENTS still unsubstituted for the caller that owns the operation context.
 *
 * The switch is exhaustive on purpose: its `never` default is what fails the build when a name is
 * added to `agentPromptClassificationStatics.promptNames` without a prompt behind it.
 */

import { agentPromptResultContract, type AgentPromptResult } from '@dungeonmaster/shared/contracts';

import type { AgentPromptName } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import { disciplineContract } from '../../contracts/discipline/discipline-contract';
import type { Discipline } from '../../contracts/discipline/discipline-contract';
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

export const agentNameToPromptTransformer = ({
  agent,
  discipline,
}: {
  agent: AgentPromptName;
  // Required for every minion whose template carries a `$DISCIPLINE` placeholder, and meaningless
  // for everything else: a ROLE derives its own, and a role's caller must not be able to ask for
  // another discipline's instructions.
  discipline?: Discipline;
}): AgentPromptResult => {
  switch (agent) {
    case 'chaoswhisperer-gap-minion':
      return agentPromptResultContract.parse({
        name: 'chaoswhisperer-gap-minion',
        model: 'sonnet',
        prompt: chaoswhispererGapMinionStatics.prompt.template,
      });
    // The five operation-owning roles share ONE template. Only the pack interpolated at
    // `$DISCIPLINE` differs, and it is derived from the role rather than passed in.
    //
    // The MODEL is read from `roleToModelStatics` for the same reason the discipline is read from
    // `roleToDisciplineStatics` two lines down: it is a per-ROLE fact that already has a home, and
    // a literal here is a second copy of it. The two are NOT interchangeable, which is what makes
    // the copy dangerous: `buildSpawnInstructionLayerBroker` sets no `model`, so every real
    // dispatch resolves the CLI `--model` flag through `roleToModelTransformer` and this map, while
    // the value here is only what `get-agent-prompt` REPORTS. A literal here can therefore disagree
    // with what the session is actually running on, in the direction nothing surfaces.
    case 'codeweaver':
    case 'pesteater':
    case 'flowrider':
    case 'groundstomper':
    case 'siegemaster':
      return agentPromptResultContract.parse({
        name: agent,
        model: roleToModelStatics[agent],
        prompt: operatorPromptStatics.prompt.template
          .replace(
            operatorPromptStatics.prompt.placeholders.discipline,
            // Function replacement, never the string form: pack markdown is authored prose that can
            // contain `$&`, `` $` `` or `$'`, and the string form expands those against the match —
            // `` $` `` splices the whole preceding prompt in.
            () =>
              disciplineToPackTransformer({ discipline: roleToDisciplineStatics[agent] })
                .operatorMarkdown,
          )
          // The discipline ID, not the pack: the template quotes it back into the
          // `get-agent-prompt` call its minions must make (and that broker REFUSES a generic minion
          // without one), AND into the header every minion brief opens with. `split`/`join` rather
          // than `.replace`, because `.replace` with a string pattern substitutes the FIRST match
          // only — the second occurrence would reach the agent as the literal token `$MY_DISCIPLINE`
          // and every minion it dispatched would fetch with that as its discipline and be refused.
          // It is also `$`-safe on its own terms: `join` performs no `$&` / `` $` `` expansion at
          // all, which is what the function form of `.replace` above is there to avoid.
          .split(operatorPromptStatics.prompt.placeholders.myDiscipline)
          .join(roleToDisciplineStatics[agent]),
      });
    // Planning is the hard part of a round and it can spike, so the planner runs on opus even
    // though it writes nothing.
    case 'planner-minion': {
      if (discipline === undefined) {
        throw new Error(
          `agentNameToPromptTransformer: "planner-minion" carries a $DISCIPLINE placeholder and must be summoned with a discipline — one of: ${disciplineContract.options.join(' | ')}`,
        );
      }
      return agentPromptResultContract.parse({
        name: 'planner-minion',
        model: 'opus',
        prompt: plannerMinionStatics.prompt.template.replace(
          plannerMinionStatics.prompt.placeholders.discipline,
          () => disciplineToPackTransformer({ discipline }).plannerMarkdown,
        ),
      });
    }
    // The worker executes ONE piece of a plan another session already made, against files it is
    // told to open — the narrowest job on the round, and the only one that is cheap on sonnet.
    case 'worker-minion': {
      if (discipline === undefined) {
        throw new Error(
          `agentNameToPromptTransformer: "worker-minion" carries a $DISCIPLINE placeholder and must be summoned with a discipline — one of: ${disciplineContract.options.join(' | ')}`,
        );
      }
      return agentPromptResultContract.parse({
        name: 'worker-minion',
        model: 'sonnet',
        prompt: workerMinionStatics.prompt.template.replace(
          workerMinionStatics.prompt.placeholders.discipline,
          () => disciplineToPackTransformer({ discipline }).workerMarkdown,
        ),
      });
    }
    // Opus, because the whole design rests on it: the operator never reads source and the
    // worker grades nothing, so this is the only session on the round that verifies anything.
    case 'reviewer-minion': {
      if (discipline === undefined) {
        throw new Error(
          `agentNameToPromptTransformer: "reviewer-minion" carries a $DISCIPLINE placeholder and must be summoned with a discipline — one of: ${disciplineContract.options.join(' | ')}`,
        );
      }
      return agentPromptResultContract.parse({
        name: 'reviewer-minion',
        model: 'opus',
        prompt: reviewerMinionStatics.prompt.template.replace(
          reviewerMinionStatics.prompt.placeholders.discipline,
          () => disciplineToPackTransformer({ discipline }).reviewerMarkdown,
        ),
      });
    }
    // Both bespoke-prompt roles read the same role map as the five above — same reason.
    case 'spiritmender':
      return agentPromptResultContract.parse({
        name: 'spiritmender',
        model: roleToModelStatics.spiritmender,
        prompt: spiritmenderPromptStatics.prompt.template,
      });
    case 'warpgate':
      return agentPromptResultContract.parse({
        name: 'warpgate',
        model: roleToModelStatics.warpgate,
        prompt: warpgatePromptStatics.prompt.template,
      });
    default: {
      const exhaustiveCheck: never = agent;
      throw new Error(`Unknown agent: ${String(exhaustiveCheck)}`);
    }
  }
};
