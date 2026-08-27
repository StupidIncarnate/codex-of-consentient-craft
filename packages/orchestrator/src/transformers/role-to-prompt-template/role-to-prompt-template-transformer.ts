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
 * IT SUBSTITUTES NOTHING. Its predecessor resolved `$DISCIPLINE` to one of five packs and
 * `$MY_DISCIPLINE` to a bare id, with a `split`/`join` for the second because `.replace` with a
 * string pattern only takes the first match, and a function replacement for the first because pack
 * markdown containing `` $` `` would otherwise splice the preceding prompt into itself. Every prompt
 * is now one file of literal text, so all of that is gone along with the placeholders.
 */

import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

import type { AgentRole } from '../../contracts/agent-role/agent-role-contract';
import { codeweaverPromptStatics } from '../../statics/codeweaver-prompt/codeweaver-prompt-statics';
import { flowriderPromptStatics } from '../../statics/flowrider-prompt/flowrider-prompt-statics';
import { groundstomperPromptStatics } from '../../statics/groundstomper-prompt/groundstomper-prompt-statics';
import { pesteaterPromptStatics } from '../../statics/pesteater-prompt/pesteater-prompt-statics';
import { siegemasterPromptStatics } from '../../statics/siegemaster-prompt/siegemaster-prompt-statics';
import { spiritmenderPromptStatics } from '../../statics/spiritmender-prompt/spiritmender-prompt-statics';
import { warpgatePromptStatics } from '../../statics/warpgate-prompt/warpgate-prompt-statics';

export const roleToPromptTemplateTransformer = ({ role }: { role: AgentRole }): ContentText => {
  switch (role) {
    case 'codeweaver':
      return contentTextContract.parse(codeweaverPromptStatics.prompt.template);
    case 'pesteater':
      return contentTextContract.parse(pesteaterPromptStatics.prompt.template);
    case 'flowrider':
      return contentTextContract.parse(flowriderPromptStatics.prompt.template);
    case 'groundstomper':
      return contentTextContract.parse(groundstomperPromptStatics.prompt.template);
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
