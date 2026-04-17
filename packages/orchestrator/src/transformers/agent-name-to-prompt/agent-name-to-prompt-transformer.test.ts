import { AgentPromptNameStub } from '../../contracts/agent-prompt-name/agent-prompt-name.stub';
import { blightwardenDeadCodeMinionStatics } from '../../statics/blightwarden-dead-code-minion/blightwarden-dead-code-minion-statics';
import { blightwardenDedupMinionStatics } from '../../statics/blightwarden-dedup-minion/blightwarden-dedup-minion-statics';
import { blightwardenIntegrityMinionStatics } from '../../statics/blightwarden-integrity-minion/blightwarden-integrity-minion-statics';
import { blightwardenPerfMinionStatics } from '../../statics/blightwarden-perf-minion/blightwarden-perf-minion-statics';
import { blightwardenSecurityMinionStatics } from '../../statics/blightwarden-security-minion/blightwarden-security-minion-statics';
import { chaoswhispererGapMinionStatics } from '../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { pathseekerQuestReviewMinionStatics } from '../../statics/pathseeker-quest-review-minion/pathseeker-quest-review-minion-statics';
import { pathseekerSurfaceScopeMinionStatics } from '../../statics/pathseeker-surface-scope-minion/pathseeker-surface-scope-minion-statics';
import { agentNameToPromptTransformer } from './agent-name-to-prompt-transformer';

describe('agentNameToPromptTransformer', () => {
  it('VALID: {agent: "chaoswhisperer-gap-minion"} => returns chaoswhisperer gap minion prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'chaoswhisperer-gap-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'chaoswhisperer-gap-minion',
      model: 'sonnet',
      prompt: chaoswhispererGapMinionStatics.prompt.template,
    });
  });

  it('VALID: {agent: "pathseeker-quest-review-minion"} => returns pathseeker quest review minion prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'pathseeker-quest-review-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'pathseeker-quest-review-minion',
      model: 'sonnet',
      prompt: pathseekerQuestReviewMinionStatics.prompt.template,
    });
  });

  it('VALID: {agent: "pathseeker-surface-scope-minion"} => returns pathseeker surface scope minion prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'pathseeker-surface-scope-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'pathseeker-surface-scope-minion',
      model: 'sonnet',
      prompt: pathseekerSurfaceScopeMinionStatics.prompt.template,
    });
  });

  it('VALID: {agent: "blightwarden-security-minion"} => returns blightwarden security minion prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'blightwarden-security-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'blightwarden-security-minion',
      model: 'sonnet',
      prompt: blightwardenSecurityMinionStatics.prompt.template,
    });
  });

  it('VALID: {agent: "blightwarden-dedup-minion"} => returns blightwarden dedup minion prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'blightwarden-dedup-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'blightwarden-dedup-minion',
      model: 'sonnet',
      prompt: blightwardenDedupMinionStatics.prompt.template,
    });
  });

  it('VALID: {agent: "blightwarden-perf-minion"} => returns blightwarden perf minion prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'blightwarden-perf-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'blightwarden-perf-minion',
      model: 'sonnet',
      prompt: blightwardenPerfMinionStatics.prompt.template,
    });
  });

  it('VALID: {agent: "blightwarden-integrity-minion"} => returns blightwarden integrity minion prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'blightwarden-integrity-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'blightwarden-integrity-minion',
      model: 'sonnet',
      prompt: blightwardenIntegrityMinionStatics.prompt.template,
    });
  });

  it('VALID: {agent: "blightwarden-dead-code-minion"} => returns blightwarden dead code minion prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'blightwarden-dead-code-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'blightwarden-dead-code-minion',
      model: 'sonnet',
      prompt: blightwardenDeadCodeMinionStatics.prompt.template,
    });
  });
});
