/**
 * PURPOSE: Resolves an agent prompt name to its prompt result (name, model, prompt text)
 *
 * USAGE:
 * const result = agentNameToPromptTransformer({ agent: agentPromptNameContract.parse('chaoswhisperer-gap-minion') });
 * // Returns { name: 'chaoswhisperer-gap-minion', model: 'sonnet', prompt: '...' }
 */

import { agentPromptResultContract, type AgentPromptResult } from '@dungeonmaster/shared/contracts';
import type { AgentPromptName } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import { blightwardenDeadCodeMinionStatics } from '../../statics/blightwarden-dead-code-minion/blightwarden-dead-code-minion-statics';
import { blightwardenDedupMinionStatics } from '../../statics/blightwarden-dedup-minion/blightwarden-dedup-minion-statics';
import { blightwardenIntegrityMinionStatics } from '../../statics/blightwarden-integrity-minion/blightwarden-integrity-minion-statics';
import { blightwardenPerfMinionStatics } from '../../statics/blightwarden-perf-minion/blightwarden-perf-minion-statics';
import { blightwardenPromptStatics } from '../../statics/blightwarden-prompt/blightwarden-prompt-statics';
import { blightwardenSecurityMinionStatics } from '../../statics/blightwarden-security-minion/blightwarden-security-minion-statics';
import { chaoswhispererGapMinionStatics } from '../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { codeweaverMinionStatics } from '../../statics/codeweaver-minion/codeweaver-minion-statics';
import { codeweaverPromptStatics } from '../../statics/codeweaver-prompt/codeweaver-prompt-statics';
import { flowriderPromptStatics } from '../../statics/flowrider-prompt/flowrider-prompt-statics';
import { lawbringerPromptStatics } from '../../statics/lawbringer-prompt/lawbringer-prompt-statics';
import { pesteaterPromptStatics } from '../../statics/pesteater-prompt/pesteater-prompt-statics';
import { pathseekerPromptStatics } from '../../statics/pathseeker-prompt/pathseeker-prompt-statics';
import { pathseekerAssertionCorrectnessMinionStatics } from '../../statics/pathseeker-assertion-correctness-minion/pathseeker-assertion-correctness-minion-statics';
import { pathseekerDedupMinionStatics } from '../../statics/pathseeker-dedup-minion/pathseeker-dedup-minion-statics';
import { pathseekerSurfaceMinionStatics } from '../../statics/pathseeker-surface-minion/pathseeker-surface-minion-statics';
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
    case 'pathseeker':
      return agentPromptResultContract.parse({
        name: 'pathseeker',
        model: 'opus',
        prompt: pathseekerPromptStatics.prompt.template,
      });
    case 'pathseeker-surface':
      return agentPromptResultContract.parse({
        name: 'pathseeker-surface',
        model: 'sonnet',
        prompt: pathseekerSurfaceMinionStatics.prompt.template,
      });
    case 'pathseeker-dedup':
      return agentPromptResultContract.parse({
        name: 'pathseeker-dedup',
        model: 'sonnet',
        prompt: pathseekerDedupMinionStatics.prompt.template,
      });
    case 'pathseeker-assertion-correctness':
      return agentPromptResultContract.parse({
        name: 'pathseeker-assertion-correctness',
        model: 'sonnet',
        prompt: pathseekerAssertionCorrectnessMinionStatics.prompt.template,
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
    case 'lawbringer':
      return agentPromptResultContract.parse({
        name: 'lawbringer',
        model: 'sonnet',
        prompt: lawbringerPromptStatics.prompt.template,
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
    case 'siegemaster':
      return agentPromptResultContract.parse({
        name: 'siegemaster',
        model: 'sonnet',
        prompt: siegemasterPromptStatics.prompt.template,
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
    case 'blightwarden-security-minion':
      return agentPromptResultContract.parse({
        name: 'blightwarden-security-minion',
        model: 'sonnet',
        prompt: blightwardenSecurityMinionStatics.prompt.template,
      });
    case 'blightwarden-dedup-minion':
      return agentPromptResultContract.parse({
        name: 'blightwarden-dedup-minion',
        model: 'sonnet',
        prompt: blightwardenDedupMinionStatics.prompt.template,
      });
    case 'blightwarden-perf-minion':
      return agentPromptResultContract.parse({
        name: 'blightwarden-perf-minion',
        model: 'sonnet',
        prompt: blightwardenPerfMinionStatics.prompt.template,
      });
    case 'blightwarden-integrity-minion':
      return agentPromptResultContract.parse({
        name: 'blightwarden-integrity-minion',
        model: 'sonnet',
        prompt: blightwardenIntegrityMinionStatics.prompt.template,
      });
    case 'blightwarden-dead-code-minion':
      return agentPromptResultContract.parse({
        name: 'blightwarden-dead-code-minion',
        model: 'sonnet',
        prompt: blightwardenDeadCodeMinionStatics.prompt.template,
      });
    default: {
      const exhaustiveCheck: never = agent;
      throw new Error(`Unknown agent: ${String(exhaustiveCheck)}`);
    }
  }
};
