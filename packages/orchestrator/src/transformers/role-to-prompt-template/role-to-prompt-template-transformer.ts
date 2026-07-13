/**
 * PURPOSE: Resolves an agent role to its corresponding prompt template string
 *
 * USAGE:
 * const template = roleToPromptTemplateTransformer({ role: agentRoleContract.parse('codeweaver') });
 * // Returns the Codeweaver prompt template as ContentText
 */

import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

import type { AgentRole } from '../../contracts/agent-role/agent-role-contract';
import { blightwardenDeadCodeMinionStatics } from '../../statics/blightwarden-dead-code-minion/blightwarden-dead-code-minion-statics';
import { blightwardenDedupMinionStatics } from '../../statics/blightwarden-dedup-minion/blightwarden-dedup-minion-statics';
import { blightwardenIntegrityMinionStatics } from '../../statics/blightwarden-integrity-minion/blightwarden-integrity-minion-statics';
import { blightwardenPerfMinionStatics } from '../../statics/blightwarden-perf-minion/blightwarden-perf-minion-statics';
import { blightwardenPromptStatics } from '../../statics/blightwarden-prompt/blightwarden-prompt-statics';
import { blightwardenSecurityMinionStatics } from '../../statics/blightwarden-security-minion/blightwarden-security-minion-statics';
import { codeweaverPromptStatics } from '../../statics/codeweaver-prompt/codeweaver-prompt-statics';
import { flowriderPromptStatics } from '../../statics/flowrider-prompt/flowrider-prompt-statics';
import { lawbringerPromptStatics } from '../../statics/lawbringer-prompt/lawbringer-prompt-statics';
import { pesteaterPromptStatics } from '../../statics/pesteater-prompt/pesteater-prompt-statics';
import { siegemasterPromptStatics } from '../../statics/siegemaster-prompt/siegemaster-prompt-statics';
import { spiritmenderPromptStatics } from '../../statics/spiritmender-prompt/spiritmender-prompt-statics';

export const roleToPromptTemplateTransformer = ({ role }: { role: AgentRole }): ContentText => {
  switch (role) {
    case 'codeweaver':
      return contentTextContract.parse(codeweaverPromptStatics.prompt.template);
    case 'flowrider':
      return contentTextContract.parse(flowriderPromptStatics.prompt.template);
    case 'siegemaster':
      return contentTextContract.parse(siegemasterPromptStatics.prompt.template);
    case 'lawbringer':
      return contentTextContract.parse(lawbringerPromptStatics.prompt.template);
    case 'spiritmender':
      return contentTextContract.parse(spiritmenderPromptStatics.prompt.template);
    case 'blightwarden-security-minion':
      return contentTextContract.parse(blightwardenSecurityMinionStatics.prompt.template);
    case 'blightwarden-dedup-minion':
      return contentTextContract.parse(blightwardenDedupMinionStatics.prompt.template);
    case 'blightwarden-perf-minion':
      return contentTextContract.parse(blightwardenPerfMinionStatics.prompt.template);
    case 'blightwarden-integrity-minion':
      return contentTextContract.parse(blightwardenIntegrityMinionStatics.prompt.template);
    case 'blightwarden-dead-code-minion':
      return contentTextContract.parse(blightwardenDeadCodeMinionStatics.prompt.template);
    case 'blightwarden':
      return contentTextContract.parse(blightwardenPromptStatics.prompt.template);
    case 'pesteater':
      return contentTextContract.parse(pesteaterPromptStatics.prompt.template);
    default: {
      const exhaustiveCheck: never = role;
      throw new Error(`Unknown role: ${String(exhaustiveCheck)}`);
    }
  }
};
