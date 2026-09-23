import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { SpawnInstructionStub } from '../spawn-instruction/spawn-instruction.stub';
import { nextStepContract } from './next-step-contract';
import { NextStepStub } from './next-step.stub';

describe('nextStepContract', () => {
  describe('idle variant', () => {
    it('VALID: {type: idle} => parses successfully', () => {
      const result = nextStepContract.parse(NextStepStub());

      expect(result).toStrictEqual({ type: 'idle' });
    });

    it('VALID: {type: idle, reason} => parses forced-idle reason', () => {
      const result = nextStepContract.parse({
        type: 'idle',
        reason: 'Node dispatcher is playing',
      });

      expect(result).toStrictEqual({
        type: 'idle',
        reason: 'Node dispatcher is playing',
      });
    });

    it('INVALID: {type: idle, reason: ""} => throws min-length error', () => {
      expect(() => nextStepContract.parse({ type: 'idle', reason: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });
  });

  describe('spawn-agents variant', () => {
    it('VALID: {type: spawn-agents, agents: [single]} => parses successfully', () => {
      const instruction = SpawnInstructionStub();

      const result = nextStepContract.parse({
        type: 'spawn-agents',
        agents: [instruction],
      });

      expect(result).toStrictEqual({
        type: 'spawn-agents',
        agents: [instruction],
      });
    });

    it('VALID: {type: spawn-agents, agents: []} => parses an empty batch', () => {
      const result = nextStepContract.parse({
        type: 'spawn-agents',
        agents: [],
      });

      expect(result).toStrictEqual({
        type: 'spawn-agents',
        agents: [],
      });
    });

    it('VALID: {type: spawn-agents, agents: [multiple]} => parses parallel batch', () => {
      const agentA = SpawnInstructionStub({
        role: 'flowrider',
        workItemId: QuestWorkItemIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
      });
      const agentB = SpawnInstructionStub({
        role: 'siegemaster',
        workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4222-9333-555555555555' }),
      });

      const result = nextStepContract.parse({
        type: 'spawn-agents',
        agents: [agentA, agentB],
      });

      expect(result).toStrictEqual({
        type: 'spawn-agents',
        agents: [agentA, agentB],
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {type: unknown} => throws discriminator error', () => {
      expect(() => nextStepContract.parse({ type: 'unknown' })).toThrow(
        /Invalid discriminator value/u,
      );
    });

    // `run-ward` and `run-riftcarver` no longer name members of this union — every family
    // carrying a command role runs it through a `run-step` handler instead (`riftcarver`'s
    // `carve`, `wardFull`'s `gate`). A regression that re-adds either literal here is the one
    // thing these two tests exist to catch.
    it('INVALID: {type: run-ward} => throws discriminator error', () => {
      expect(() =>
        nextStepContract.parse({
          type: 'run-ward',
          questId: 'add-auth',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        }),
      ).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID: {type: run-riftcarver} => throws discriminator error', () => {
      expect(() =>
        nextStepContract.parse({
          type: 'run-riftcarver',
          questId: 'add-auth',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        }),
      ).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID: {type: spawn-agents, missing agents} => throws Required', () => {
      expect(() => nextStepContract.parse({ type: 'spawn-agents' })).toThrow(/Required/u);
    });
  });
});
