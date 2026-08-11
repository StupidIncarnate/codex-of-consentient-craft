import { AgentPromptNameStub } from '../../contracts/agent-prompt-name/agent-prompt-name.stub';
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
import { groundstomperPromptStatics } from '../../statics/groundstomper-prompt/groundstomper-prompt-statics';
import { pesteaterPromptStatics } from '../../statics/pesteater-prompt/pesteater-prompt-statics';
import { siegemasterWalkerMinionStatics } from '../../statics/siegemaster-walker-minion/siegemaster-walker-minion-statics';
import { siegemasterPromptStatics } from '../../statics/siegemaster-prompt/siegemaster-prompt-statics';
import { spiritmenderPromptStatics } from '../../statics/spiritmender-prompt/spiritmender-prompt-statics';
import { warpgatePromptStatics } from '../../statics/warpgate-prompt/warpgate-prompt-statics';
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

  it('VALID: {agent: "codeweaver-piece-minion"} => returns codeweaver-piece-minion prompt data on sonnet', () => {
    const agent = AgentPromptNameStub({ value: 'codeweaver-piece-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'codeweaver-piece-minion',
      model: 'sonnet',
      prompt: codeweaverPieceMinionStatics.prompt.template,
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

  it('VALID: {agent: "groundstomper"} => returns groundstomper prompt data on opus', () => {
    const agent = AgentPromptNameStub({ value: 'groundstomper' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'groundstomper',
      model: 'opus',
      prompt: groundstomperPromptStatics.prompt.template,
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

  it('VALID: {agent: "flowrider-authoring-minion"} => returns flowrider-authoring-minion prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'flowrider-authoring-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'flowrider-authoring-minion',
      model: 'sonnet',
      prompt: flowriderAuthoringMinionStatics.prompt.template,
    });
  });

  it('VALID: {agent: "flowrider-coverage-minion"} => returns flowrider-coverage-minion prompt data on sonnet', () => {
    const agent = AgentPromptNameStub({ value: 'flowrider-coverage-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'flowrider-coverage-minion',
      model: 'sonnet',
      prompt: flowriderCoverageMinionStatics.prompt.template,
    });
  });

  it('VALID: {agent: "siegemaster-walker-minion"} => returns siegemaster-walker-minion prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'siegemaster-walker-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'siegemaster-walker-minion',
      model: 'sonnet',
      prompt: siegemasterWalkerMinionStatics.prompt.template,
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

  it('VALID: {agent: "blightwarden-group-minion"} => returns blightwarden-group-minion prompt data on sonnet', () => {
    const agent = AgentPromptNameStub({ value: 'blightwarden-group-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'blightwarden-group-minion',
      model: 'sonnet',
      prompt: blightwardenGroupMinionStatics.prompt.template,
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

  it('VALID: {agent: "blightwarden-deadcode-minion"} => returns blightwarden-deadcode-minion prompt data on sonnet', () => {
    const agent = AgentPromptNameStub({ value: 'blightwarden-deadcode-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'blightwarden-deadcode-minion',
      model: 'sonnet',
      prompt: blightwardenDeadcodeMinionStatics.prompt.template,
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

  it('VALID: {agent: "warpgate"} => returns warpgate prompt data on opus', () => {
    const agent = AgentPromptNameStub({ value: 'warpgate' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'warpgate',
      model: 'opus',
      prompt: warpgatePromptStatics.prompt.template,
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
