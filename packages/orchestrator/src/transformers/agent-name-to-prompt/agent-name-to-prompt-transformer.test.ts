import { AgentPromptNameStub } from '../../contracts/agent-prompt-name/agent-prompt-name.stub';
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

  it('VALID: {agent: "pathseeker"} => returns pathseeker parent prompt data on opus', () => {
    const agent = AgentPromptNameStub({ value: 'pathseeker' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'pathseeker',
      model: 'opus',
      prompt: pathseekerPromptStatics.prompt.template,
    });
  });

  it('VALID: {agent: "pathseeker-surface"} => returns pathseeker-surface prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'pathseeker-surface' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'pathseeker-surface',
      model: 'sonnet',
      prompt: pathseekerSurfaceMinionStatics.prompt.template,
    });
  });

  it('VALID: {agent: "pathseeker-dedup"} => returns pathseeker-dedup prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'pathseeker-dedup' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'pathseeker-dedup',
      model: 'sonnet',
      prompt: pathseekerDedupMinionStatics.prompt.template,
    });
  });

  it('VALID: {agent: "pathseeker-assertion-correctness"} => returns pathseeker-assertion-correctness prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'pathseeker-assertion-correctness' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'pathseeker-assertion-correctness',
      model: 'sonnet',
      prompt: pathseekerAssertionCorrectnessMinionStatics.prompt.template,
    });
  });

  it('VALID: {agent: "codeweaver"} => returns codeweaver prompt data on opus', () => {
    const agent = AgentPromptNameStub({ value: 'codeweaver' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'codeweaver',
      model: 'opus',
      prompt: codeweaverPromptStatics.prompt.template,
    });
  });

  it('VALID: {agent: "codeweaver-minion"} => returns codeweaver-minion prompt data on sonnet', () => {
    const agent = AgentPromptNameStub({ value: 'codeweaver-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'codeweaver-minion',
      model: 'sonnet',
      prompt: codeweaverMinionStatics.prompt.template,
    });
  });

  it('VALID: {agent: "lawbringer"} => returns lawbringer prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'lawbringer' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'lawbringer',
      model: 'sonnet',
      prompt: lawbringerPromptStatics.prompt.template,
    });
  });

  it('VALID: {agent: "spiritmender"} => returns spiritmender prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'spiritmender' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'spiritmender',
      model: 'sonnet',
      prompt: spiritmenderPromptStatics.prompt.template,
    });
  });

  it('VALID: {agent: "flowrider"} => returns flowrider prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'flowrider' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'flowrider',
      model: 'opus',
      prompt: flowriderPromptStatics.prompt.template,
    });
  });

  it('VALID: {agent: "siegemaster"} => returns siegemaster prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'siegemaster' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'siegemaster',
      model: 'sonnet',
      prompt: siegemasterPromptStatics.prompt.template,
    });
  });

  it('VALID: {agent: "blightwarden"} => returns blightwarden prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'blightwarden' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'blightwarden',
      model: 'sonnet',
      prompt: blightwardenPromptStatics.prompt.template,
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

  it('VALID: {agent: "pesteater"} => returns pesteater prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'pesteater' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'pesteater',
      model: 'opus',
      prompt: pesteaterPromptStatics.prompt.template,
    });
  });
});
