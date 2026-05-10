import { AgentPromptNameStub } from '../../contracts/agent-prompt-name/agent-prompt-name.stub';
import { blightwardenDeadCodeMinionStatics } from '../../statics/blightwarden-dead-code-minion/blightwarden-dead-code-minion-statics';
import { blightwardenDedupMinionStatics } from '../../statics/blightwarden-dedup-minion/blightwarden-dedup-minion-statics';
import { blightwardenIntegrityMinionStatics } from '../../statics/blightwarden-integrity-minion/blightwarden-integrity-minion-statics';
import { blightwardenPerfMinionStatics } from '../../statics/blightwarden-perf-minion/blightwarden-perf-minion-statics';
import { blightwardenSecurityMinionStatics } from '../../statics/blightwarden-security-minion/blightwarden-security-minion-statics';
import { chaoswhispererGapMinionStatics } from '../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { pathseekerAssertionCorrectnessMinionStatics } from '../../statics/pathseeker-assertion-correctness-minion/pathseeker-assertion-correctness-minion-statics';
import { pathseekerContractDedupMinionStatics } from '../../statics/pathseeker-contract-dedup-minion/pathseeker-contract-dedup-minion-statics';
import { pathseekerVerifyMinionStatics } from '../../statics/pathseeker-verify-minion/pathseeker-verify-minion-statics';
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

  it('VALID: {agent: "pathseeker-verify-minion"} => returns pathseeker verify minion prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'pathseeker-verify-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'pathseeker-verify-minion',
      model: 'sonnet',
      prompt: pathseekerVerifyMinionStatics.prompt.template,
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

  it('VALID: {agent: "pathseeker-contract-dedup-minion"} => returns pathseeker contract dedup minion prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'pathseeker-contract-dedup-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'pathseeker-contract-dedup-minion',
      model: 'sonnet',
      prompt: pathseekerContractDedupMinionStatics.prompt.template,
    });
  });

  it('VALID: {agent: "pathseeker-assertion-correctness-minion"} => returns pathseeker assertion correctness minion prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'pathseeker-assertion-correctness-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'pathseeker-assertion-correctness-minion',
      model: 'sonnet',
      prompt: pathseekerAssertionCorrectnessMinionStatics.prompt.template,
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
