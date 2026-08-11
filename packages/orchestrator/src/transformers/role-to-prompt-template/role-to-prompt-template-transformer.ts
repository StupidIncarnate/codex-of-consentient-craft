/**
 * PURPOSE: Resolves an agent role to its corresponding prompt template string
 *
 * USAGE:
 * const template = roleToPromptTemplateTransformer({ role: agentRoleContract.parse('codeweaver') });
 * // Returns the Codeweaver prompt template as ContentText
 */

import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

import type { AgentRole } from '../../contracts/agent-role/agent-role-contract';
import { blightwardenCrosscutMinionStatics } from '../../statics/blightwarden-crosscut-minion/blightwarden-crosscut-minion-statics';
import { blightwardenGroupMinionStatics } from '../../statics/blightwarden-group-minion/blightwarden-group-minion-statics';
import { blightwardenPromptStatics } from '../../statics/blightwarden-prompt/blightwarden-prompt-statics';
import { codeweaverPromptStatics } from '../../statics/codeweaver-prompt/codeweaver-prompt-statics';
import { flowriderPromptStatics } from '../../statics/flowrider-prompt/flowrider-prompt-statics';
import { pesteaterPromptStatics } from '../../statics/pesteater-prompt/pesteater-prompt-statics';
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
    case 'blightwarden-group-minion':
      return contentTextContract.parse(blightwardenGroupMinionStatics.prompt.template);
    case 'blightwarden-crosscut-minion':
      return contentTextContract.parse(blightwardenCrosscutMinionStatics.prompt.template);
    case 'blightwarden':
      return contentTextContract.parse(blightwardenPromptStatics.prompt.template);
    case 'pesteater':
      return contentTextContract.parse(pesteaterPromptStatics.prompt.template);
    case 'warpgate':
      return contentTextContract.parse(warpgatePromptStatics.prompt.template);
    default: {
      const exhaustiveCheck: never = role;
      throw new Error(`Unknown role: ${String(exhaustiveCheck)}`);
    }
  }
};
