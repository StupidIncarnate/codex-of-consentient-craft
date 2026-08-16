/**
 * PURPOSE: Resolves an agent role to the prompt template the relay path substitutes `$ARGUMENTS`
 * into, with `$DISCIPLINE` and `$MY_DISCIPLINE` ALREADY resolved for that role. Reach for this over
 * `agentNameToPromptTransformer` when you hold an `AgentRole` and want only the template text —
 * this one's `never` default is keyed on the role union, so a role added without a template is a
 * compile error here even though every role also resolves through the agent-name switch.
 *
 * USAGE:
 * const template = roleToPromptTemplateTransformer({ role: agentRoleContract.parse('codeweaver') });
 * // Returns the operation-orchestrator template with the implementation pack interpolated
 */

import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

import type { AgentRole } from '../../contracts/agent-role/agent-role-contract';
import { operationOrchestratorPromptStatics } from '../../statics/operation-orchestrator-prompt/operation-orchestrator-prompt-statics';
import { roleToDisciplineStatics } from '../../statics/role-to-discipline/role-to-discipline-statics';
import { spiritmenderPromptStatics } from '../../statics/spiritmender-prompt/spiritmender-prompt-statics';
import { warpgatePromptStatics } from '../../statics/warpgate-prompt/warpgate-prompt-statics';
import { disciplineToPackTransformer } from '../discipline-to-pack/discipline-to-pack-transformer';

export const roleToPromptTemplateTransformer = ({ role }: { role: AgentRole }): ContentText => {
  switch (role) {
    // One template, five disciplines. The pack is the only thing that differs, and it is derived
    // from the role so no caller can request another discipline's instructions.
    case 'codeweaver':
    case 'pesteater':
    case 'flowrider':
    case 'groundstomper':
    case 'siegemaster':
      return contentTextContract.parse(
        operationOrchestratorPromptStatics.prompt.template
          .replace(
            operationOrchestratorPromptStatics.prompt.placeholders.discipline,
            // Function replacement, never the string form: pack markdown is authored prose that can
            // contain `$&`, `` $` `` or `$'`, which the string form would expand against the match.
            () =>
              disciplineToPackTransformer({ discipline: roleToDisciplineStatics[role] })
                .orchestratorMarkdown,
          )
          // The discipline ID, not the pack: the template quotes it back into the
          // `get-agent-prompt` call its minions must make, and that broker REFUSES a generic
          // minion without one. Same function form for the same reason — and the two tokens
          // share no prefix, so neither substitution can eat the other whatever the order.
          .replace(
            operationOrchestratorPromptStatics.prompt.placeholders.myDiscipline,
            () => roleToDisciplineStatics[role],
          ),
      );
    case 'spiritmender':
      return contentTextContract.parse(spiritmenderPromptStatics.prompt.template);
    case 'warpgate':
      return contentTextContract.parse(warpgatePromptStatics.prompt.template);
    default: {
      const exhaustiveCheck: never = role;
      throw new Error(`Unknown role: ${String(exhaustiveCheck)}`);
    }
  }
};
