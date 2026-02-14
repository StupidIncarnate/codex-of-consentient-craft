/**
 * PURPOSE: Resolves an agent role to its corresponding prompt template string
 *
 * USAGE:
 * const template = roleToPromptTemplateTransformer({ role: agentRoleContract.parse('codeweaver') });
 * // Returns the Codeweaver prompt template as ContentText
 */

import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

import type { AgentRole } from '../../contracts/agent-role/agent-role-contract';
import { codeweaverPromptStatics } from '../../statics/codeweaver-prompt/codeweaver-prompt-statics';
import { lawbringerPromptStatics } from '../../statics/lawbringer-prompt/lawbringer-prompt-statics';
import { pathseekerPromptStatics } from '../../statics/pathseeker-prompt/pathseeker-prompt-statics';
import { siegemasterPromptStatics } from '../../statics/siegemaster-prompt/siegemaster-prompt-statics';
import { spiritmenderPromptStatics } from '../../statics/spiritmender-prompt/spiritmender-prompt-statics';
import { resolveServerUrlTransformer } from '../resolve-server-url/resolve-server-url-transformer';

export const roleToPromptTemplateTransformer = ({ role }: { role: AgentRole }): ContentText => {
  switch (role) {
    case 'codeweaver':
      return resolveServerUrlTransformer({
        template: contentTextContract.parse(codeweaverPromptStatics.prompt.template),
      });
    case 'pathseeker':
      return resolveServerUrlTransformer({
        template: contentTextContract.parse(pathseekerPromptStatics.prompt.template),
      });
    case 'siegemaster':
      return resolveServerUrlTransformer({
        template: contentTextContract.parse(siegemasterPromptStatics.prompt.template),
      });
    case 'lawbringer':
      return resolveServerUrlTransformer({
        template: contentTextContract.parse(lawbringerPromptStatics.prompt.template),
      });
    case 'spiritmender':
      return resolveServerUrlTransformer({
        template: contentTextContract.parse(spiritmenderPromptStatics.prompt.template),
      });
    default: {
      const exhaustiveCheck: never = role;
      throw new Error(`Unknown role: ${String(exhaustiveCheck)}`);
    }
  }
};
