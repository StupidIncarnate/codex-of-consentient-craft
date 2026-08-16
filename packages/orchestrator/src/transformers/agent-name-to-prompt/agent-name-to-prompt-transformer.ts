/**
 * PURPOSE: Resolves an agent prompt name to the prompt result `get-agent-prompt` serves — and is
 * the ONE place `$DISCIPLINE` (and, for a role, `$MY_DISCIPLINE`) is substituted, so no caller
 * downstream can hand an agent the literal token. An orchestrator ROLE derives its own discipline
 * from `roleToDisciplineStatics`; the three generic minions have none of their own and must be
 * given one by the parent that summons them — which is why a role's served prompt has to carry the
 * discipline ID as well as the pack.
 *
 * USAGE:
 * agentNameToPromptTransformer({ agent: agentPromptNameContract.parse('codeweaver') });
 * // Returns { name: 'codeweaver', model: 'opus', prompt: '...' } — $DISCIPLINE resolved,
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
import { operationOrchestratorPromptStatics } from '../../statics/operation-orchestrator-prompt/operation-orchestrator-prompt-statics';
import { plannerMinionStatics } from '../../statics/planner-minion/planner-minion-statics';
import { reviewerMinionStatics } from '../../statics/reviewer-minion/reviewer-minion-statics';
import { roleToDisciplineStatics } from '../../statics/role-to-discipline/role-to-discipline-statics';
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
    case 'codeweaver':
    case 'pesteater':
    case 'flowrider':
    case 'groundstomper':
    case 'siegemaster':
      return agentPromptResultContract.parse({
        name: agent,
        model: 'opus',
        prompt: operationOrchestratorPromptStatics.prompt.template
          .replace(
            operationOrchestratorPromptStatics.prompt.placeholders.discipline,
            // Function replacement, never the string form: pack markdown is authored prose that can
            // contain `$&`, `` $` `` or `$'`, and the string form expands those against the match —
            // `` $` `` splices the whole preceding prompt in.
            () =>
              disciplineToPackTransformer({ discipline: roleToDisciplineStatics[agent] })
                .orchestratorMarkdown,
          )
          // The discipline ID, not the pack: the template quotes it back into the
          // `get-agent-prompt` call its minions must make, and that broker REFUSES a generic
          // minion without one. Same function form for the same reason — and the two tokens
          // share no prefix, so neither substitution can eat the other whatever the order.
          .replace(
            operationOrchestratorPromptStatics.prompt.placeholders.myDiscipline,
            () => roleToDisciplineStatics[agent],
          ),
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
    // Opus, because the whole design rests on it: the orchestrator never reads source and the
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
    case 'spiritmender':
      return agentPromptResultContract.parse({
        name: 'spiritmender',
        model: 'sonnet',
        prompt: spiritmenderPromptStatics.prompt.template,
      });
    case 'warpgate':
      return agentPromptResultContract.parse({
        name: 'warpgate',
        model: 'opus',
        prompt: warpgatePromptStatics.prompt.template,
      });
    default: {
      const exhaustiveCheck: never = agent;
      throw new Error(`Unknown agent: ${String(exhaustiveCheck)}`);
    }
  }
};
