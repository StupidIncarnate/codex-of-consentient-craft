import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

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

  describe('run-ward variant', () => {
    it('VALID: {type: run-ward, mode: changed} => parses successfully', () => {
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });

      const result = nextStepContract.parse({
        type: 'run-ward',
        questId,
        workItemId,
        mode: 'changed',
      });

      expect(result).toStrictEqual({
        type: 'run-ward',
        questId,
        workItemId,
        mode: 'changed',
      });
    });

    it('VALID: {type: run-ward, mode: full} => parses successfully', () => {
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });

      const result = nextStepContract.parse({
        type: 'run-ward',
        questId,
        workItemId,
        mode: 'full',
      });

      expect(result).toStrictEqual({
        type: 'run-ward',
        questId,
        workItemId,
        mode: 'full',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {type: unknown} => throws discriminator error', () => {
      expect(() => nextStepContract.parse({ type: 'unknown' })).toThrow(
        /Invalid discriminator value/u,
      );
    });

    it('INVALID: {type: run-ward, mode: partial} => throws enum error', () => {
      expect(() =>
        nextStepContract.parse({
          type: 'run-ward',
          questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
          mode: 'partial',
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {type: run-ward, missing questId} => throws Required', () => {
      expect(() =>
        nextStepContract.parse({
          type: 'run-ward',
          workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
          mode: 'full',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {type: spawn-agents, missing agents} => throws Required', () => {
      expect(() => nextStepContract.parse({ type: 'spawn-agents' })).toThrow(/Required/u);
    });
  });
});
