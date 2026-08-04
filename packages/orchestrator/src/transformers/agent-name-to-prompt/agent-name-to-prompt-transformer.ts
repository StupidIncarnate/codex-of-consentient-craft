/**
 * PURPOSE: Resolves an agent prompt name to its prompt result (name, model, prompt text)
 *
 * USAGE:
 * const result = agentNameToPromptTransformer({ agent: agentPromptNameContract.parse('chaoswhisperer-gap-minion') });
 * // Returns { name: 'chaoswhisperer-gap-minion', model: 'sonnet', prompt: '...' }
 */

import { agentPromptResultContract, type AgentPromptResult } from '@dungeonmaster/shared/contracts';
import type { AgentPromptName } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import { blightwardenCrosscutMinionStatics } from '../../statics/blightwarden-crosscut-minion/blightwarden-crosscut-minion-statics';
import { blightwardenMinionStatics } from '../../statics/blightwarden-minion/blightwarden-minion-statics';
import { blightwardenPromptStatics } from '../../statics/blightwarden-prompt/blightwarden-prompt-statics';
import { chaoswhispererGapMinionStatics } from '../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { codeweaverMinionStatics } from '../../statics/codeweaver-minion/codeweaver-minion-statics';
import { codeweaverPromptStatics } from '../../statics/codeweaver-prompt/codeweaver-prompt-statics';
import { flowriderMinionStatics } from '../../statics/flowrider-minion/flowrider-minion-statics';
import { flowriderPromptStatics } from '../../statics/flowrider-prompt/flowrider-prompt-statics';
import { pesteaterPromptStatics } from '../../statics/pesteater-prompt/pesteater-prompt-statics';
import { siegemasterMinionStatics } from '../../statics/siegemaster-minion/siegemaster-minion-statics';
import { siegemasterTestAuditMinionStatics } from '../../statics/siegemaster-test-audit-minion/siegemaster-test-audit-minion-statics';
import { siegemasterPromptStatics } from '../../statics/siegemaster-prompt/siegemaster-prompt-statics';
import { spiritmenderPromptStatics } from '../../statics/spiritmender-prompt/spiritmender-prompt-statics';

export const agentNameToPromptTransformer = ({
  agent,
}: {
  agent: AgentPromptName;
}): AgentPromptResult => {
  switch (agent) {
    case 'chaoswhisperer-gap-minion':
      return agentPromptResultContract.parse({
        name: 'chaoswhisperer-gap-minion',
        model: 'sonnet',
        prompt: chaoswhispererGapMinionStatics.prompt.template,
      });
    case 'codeweaver':
      return agentPromptResultContract.parse({
        name: 'codeweaver',
        model: 'opus',
        prompt: codeweaverPromptStatics.prompt.template,
      });
    case 'codeweaver-minion':
      return agentPromptResultContract.parse({
        name: 'codeweaver-minion',
        model: 'sonnet',
        prompt: codeweaverMinionStatics.prompt.template,
      });
    case 'spiritmender':
      return agentPromptResultContract.parse({
        name: 'spiritmender',
        model: 'sonnet',
        prompt: spiritmenderPromptStatics.prompt.template,
      });
    case 'flowrider':
      return agentPromptResultContract.parse({
        name: 'flowrider',
        model: 'opus',
        prompt: flowriderPromptStatics.prompt.template,
      });
    case 'flowrider-minion':
      return agentPromptResultContract.parse({
        name: 'flowrider-minion',
        model: 'sonnet',
        prompt: flowriderMinionStatics.prompt.template,
      });
    case 'siegemaster':
      return agentPromptResultContract.parse({
        name: 'siegemaster',
        model: 'opus',
        prompt: siegemasterPromptStatics.prompt.template,
      });
    case 'siegemaster-minion':
      return agentPromptResultContract.parse({
        name: 'siegemaster-minion',
        model: 'sonnet',
        prompt: siegemasterMinionStatics.prompt.template,
      });
    case 'siegemaster-test-audit-minion':
      return agentPromptResultContract.parse({
        name: 'siegemaster-test-audit-minion',
        model: 'sonnet',
        prompt: siegemasterTestAuditMinionStatics.prompt.template,
      });
    case 'blightwarden':
      return agentPromptResultContract.parse({
        name: 'blightwarden',
        model: 'sonnet',
        prompt: blightwardenPromptStatics.prompt.template,
      });
    case 'pesteater':
      return agentPromptResultContract.parse({
        name: 'pesteater',
        model: 'opus',
        prompt: pesteaterPromptStatics.prompt.template,
      });
    case 'blightwarden-minion':
      return agentPromptResultContract.parse({
        name: 'blightwarden-minion',
        model: 'sonnet',
        prompt: blightwardenMinionStatics.prompt.template,
      });
    case 'blightwarden-crosscut-minion':
      return agentPromptResultContract.parse({
        name: 'blightwarden-crosscut-minion',
        model: 'sonnet',
        prompt: blightwardenCrosscutMinionStatics.prompt.template,
      });
    default: {
      const exhaustiveCheck: never = agent;
      throw new Error(`Unknown agent: ${String(exhaustiveCheck)}`);
    }
  }
};
