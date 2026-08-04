import { AgentPromptNameStub } from '../../contracts/agent-prompt-name/agent-prompt-name.stub';
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
      model: 'opus',
      prompt: siegemasterPromptStatics.prompt.template,
    });
  });

  it('VALID: {agent: "flowrider-minion"} => returns flowrider-minion prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'flowrider-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'flowrider-minion',
      model: 'sonnet',
      prompt: flowriderMinionStatics.prompt.template,
    });
  });

  it('VALID: {agent: "siegemaster-minion"} => returns siegemaster-minion prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'siegemaster-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'siegemaster-minion',
      model: 'sonnet',
      prompt: siegemasterMinionStatics.prompt.template,
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

  it('VALID: {agent: "blightwarden-minion"} => returns blightwarden-minion prompt data on sonnet', () => {
    const agent = AgentPromptNameStub({ value: 'blightwarden-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'blightwarden-minion',
      model: 'sonnet',
      prompt: blightwardenMinionStatics.prompt.template,
    });
  });

  it('VALID: {agent: "blightwarden-crosscut-minion"} => returns blightwarden-crosscut-minion prompt data on sonnet', () => {
    const agent = AgentPromptNameStub({ value: 'blightwarden-crosscut-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'blightwarden-crosscut-minion',
      model: 'sonnet',
      prompt: blightwardenCrosscutMinionStatics.prompt.template,
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

  describe('pathseeker family is not a valid agent prompt name', () => {
    it.each([
      'pathseeker',
      'pathseeker-surface',
      'pathseeker-dedup',
      'pathseeker-assertion-correctness',
    ])('INVALID: {value: "%s"} => throws parsing the agent prompt name', (value) => {
      expect(() => {
        AgentPromptNameStub({ value });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
