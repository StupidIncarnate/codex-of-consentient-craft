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
import { blightwardenSecurityMinionStatics } from '../../statics/blightwarden-security-minion/blightwarden-security-minion-statics';
import { chaoswhispererGapMinionStatics } from '../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { pathseekerAssertionCorrectnessStatics } from '../../statics/pathseeker-assertion-correctness/pathseeker-assertion-correctness-statics';
import { pathseekerDedupStatics } from '../../statics/pathseeker-dedup/pathseeker-dedup-statics';
import { pathseekerSurfaceStatics } from '../../statics/pathseeker-surface/pathseeker-surface-statics';
import { pathseekerWalkStatics } from '../../statics/pathseeker-walk/pathseeker-walk-statics';

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
    case 'pathseeker-surface':
      return agentPromptResultContract.parse({
        name: 'pathseeker-surface',
        model: 'sonnet',
        prompt: pathseekerSurfaceStatics.prompt.template,
      });
    case 'pathseeker-dedup':
      return agentPromptResultContract.parse({
        name: 'pathseeker-dedup',
        model: 'sonnet',
        prompt: pathseekerDedupStatics.prompt.template,
      });
    case 'pathseeker-assertion-correctness':
      return agentPromptResultContract.parse({
        name: 'pathseeker-assertion-correctness',
        model: 'sonnet',
        prompt: pathseekerAssertionCorrectnessStatics.prompt.template,
      });
    case 'pathseeker-walk':
      return agentPromptResultContract.parse({
        name: 'pathseeker-walk',
        model: 'sonnet',
        prompt: pathseekerWalkStatics.prompt.template,
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
