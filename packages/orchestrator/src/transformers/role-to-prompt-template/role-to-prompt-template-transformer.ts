/**
 * PURPOSE: Resolves an agent role to the prompt template the relay path substitutes `$ARGUMENTS`
 * into. Reach for this over `agentNameToPromptTransformer` when you hold an `AgentRole` and want
 * only the template text — this one's `never` default is keyed on the role union, so a role added
 * without a template is a compile error here even though every role also resolves through the
 * agent-name table.
 *
 * USAGE:
 * const template = roleToPromptTemplateTransformer({ role: agentRoleContract.parse('codeweaver') });
 * // Returns codeweaver's whole prompt, with only `$ARGUMENTS` left to substitute
 *
 * IT SUBSTITUTES NOTHING. Every prompt is one file of literal text, so the only placeholder any
 * template still carries is the `$ARGUMENTS` the relay path fills in downstream.
 */

import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

import type { AgentRole } from '../../contracts/agent-role/agent-role-contract';
import { codeweaverPromptStatics } from '../../statics/codeweaver-prompt/codeweaver-prompt-statics';
import { flowriderPromptStatics } from '../../statics/flowrider-prompt/flowrider-prompt-statics';
import { siegemasterPromptStatics } from '../../statics/siegemaster-prompt/siegemaster-prompt-statics';
import { spiritmenderPromptStatics } from '../../statics/spiritmender-prompt/spiritmender-prompt-statics';
import { warpgatePromptStatics } from '../../statics/warpgate-prompt/warpgate-prompt-statics';

export const roleToPromptTemplateTransformer = ({ role }: { role: AgentRole }): ContentText => {
  switch (role) {
    case 'codeweaver':
      return contentTextContract.parse(codeweaverPromptStatics.prompt.template);
    case 'flowrider':
      return contentTextContract.parse(flowriderPromptStatics.prompt.template);
    case 'siegemaster':
      return contentTextContract.parse(siegemasterPromptStatics.prompt.template);
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
