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
import { blightwardenDeadcodeMinionStatics } from '../../statics/blightwarden-deadcode-minion/blightwarden-deadcode-minion-statics';
import { blightwardenGroupMinionStatics } from '../../statics/blightwarden-group-minion/blightwarden-group-minion-statics';
import { blightwardenPromptStatics } from '../../statics/blightwarden-prompt/blightwarden-prompt-statics';
import { chaoswhispererGapMinionStatics } from '../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { codeweaverPieceMinionStatics } from '../../statics/codeweaver-piece-minion/codeweaver-piece-minion-statics';
import { codeweaverPromptStatics } from '../../statics/codeweaver-prompt/codeweaver-prompt-statics';
import { flowriderCoverageMinionStatics } from '../../statics/flowrider-coverage-minion/flowrider-coverage-minion-statics';
import { flowriderAuthoringMinionStatics } from '../../statics/flowrider-authoring-minion/flowrider-authoring-minion-statics';
import { flowriderPromptStatics } from '../../statics/flowrider-prompt/flowrider-prompt-statics';
import { pesteaterPromptStatics } from '../../statics/pesteater-prompt/pesteater-prompt-statics';
import { siegemasterWalkerMinionStatics } from '../../statics/siegemaster-walker-minion/siegemaster-walker-minion-statics';
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
    case 'codeweaver-piece-minion':
      return agentPromptResultContract.parse({
        name: 'codeweaver-piece-minion',
        model: 'sonnet',
        prompt: codeweaverPieceMinionStatics.prompt.template,
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
    case 'flowrider-authoring-minion':
      return agentPromptResultContract.parse({
        name: 'flowrider-authoring-minion',
        model: 'sonnet',
        prompt: flowriderAuthoringMinionStatics.prompt.template,
      });
    case 'flowrider-coverage-minion':
      return agentPromptResultContract.parse({
        name: 'flowrider-coverage-minion',
        model: 'sonnet',
        prompt: flowriderCoverageMinionStatics.prompt.template,
      });
    case 'siegemaster':
      return agentPromptResultContract.parse({
        name: 'siegemaster',
        model: 'opus',
        prompt: siegemasterPromptStatics.prompt.template,
      });
    case 'siegemaster-walker-minion':
      return agentPromptResultContract.parse({
        name: 'siegemaster-walker-minion',
        model: 'sonnet',
        prompt: siegemasterWalkerMinionStatics.prompt.template,
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
    case 'blightwarden-group-minion':
      return agentPromptResultContract.parse({
        name: 'blightwarden-group-minion',
        model: 'sonnet',
        prompt: blightwardenGroupMinionStatics.prompt.template,
      });
    case 'blightwarden-crosscut-minion':
      return agentPromptResultContract.parse({
        name: 'blightwarden-crosscut-minion',
        model: 'sonnet',
        prompt: blightwardenCrosscutMinionStatics.prompt.template,
      });
    case 'blightwarden-deadcode-minion':
      return agentPromptResultContract.parse({
        name: 'blightwarden-deadcode-minion',
        model: 'sonnet',
        prompt: blightwardenDeadcodeMinionStatics.prompt.template,
      });
    default: {
      const exhaustiveCheck: never = agent;
      throw new Error(`Unknown agent: ${String(exhaustiveCheck)}`);
    }
  }
};
