import { AdapterResultStub } from '@dungeonmaster/shared/contracts';

import { NextStepStub } from '../../../contracts/next-step/next-step.stub';
import { SpawnInstructionStub } from '../../../contracts/spawn-instruction/spawn-instruction.stub';
import { orchestrationDispatchStatics } from '../../../statics/orchestration-dispatch/orchestration-dispatch-statics';
import { questNodeDispatchLoopBroker } from './quest-node-dispatch-loop-broker';
import { questNodeDispatchLoopBrokerProxy } from './quest-node-dispatch-loop-broker.proxy';

describe('questNodeDispatchLoopBroker', () => {
  describe('pause gating', () => {
    it('VALID: {isPlaying: false} => returns ok without consulting the state machine', async () => {
      const proxy = questNodeDispatchLoopBrokerProxy();

      const result = await questNodeDispatchLoopBroker({ isPlaying: (): boolean => false });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getNextStepCalls()).toStrictEqual([]);
    });

    it('VALID: {pause flips after first dispatch} => in-flight batch finishes, nothing new dispatches', async () => {
      const proxy = questNodeDispatchLoopBrokerProxy();
      const agents = [SpawnInstructionStub()];
      const spawnStep = NextStepStub({ type: 'spawn-agents', agents });
      proxy.queueStep({ step: spawnStep });
      proxy.queueStep({ step: spawnStep });
      const isPlaying = jest.fn().mockReturnValueOnce(true).mockReturnValue(false);

      const result = await questNodeDispatchLoopBroker({ isPlaying });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getSpawnBatchCalls()).toStrictEqual([{ agents }]);
      expect(proxy.getNextStepCalls()).toStrictEqual([
        {
          activeQuest: { setActive: expect.any(Function), clear: expect.any(Function) },
          longPollTotalMs: orchestrationDispatchStatics.loop.longPollTotalMs,
          longPollIntervalMs: orchestrationDispatchStatics.loop.longPollIntervalMs,
        },
      ]);
    });
  });

  describe('dispatch switch', () => {
    it('VALID: {idle step} => returns ok after one scan', async () => {
      const proxy = questNodeDispatchLoopBrokerProxy();

      const result = await questNodeDispatchLoopBroker({ isPlaying: (): boolean => true });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getNextStepCalls()).toStrictEqual([
        {
          activeQuest: { setActive: expect.any(Function), clear: expect.any(Function) },
          longPollTotalMs: orchestrationDispatchStatics.loop.longPollTotalMs,
          longPollIntervalMs: orchestrationDispatchStatics.loop.longPollIntervalMs,
        },
      ]);
      expect(proxy.getSpawnBatchCalls()).toStrictEqual([]);
      expect(proxy.getRunWardCalls()).toStrictEqual([]);
    });

    it('VALID: {run-ward step then idle} => runs ward with questId/workItemId/mode then recurses to idle', async () => {
      const proxy = questNodeDispatchLoopBrokerProxy();
      const wardStep = NextStepStub({
        type: 'run-ward',
        questId: 'add-auth',
        workItemId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        mode: 'changed',
      } as never);
      proxy.queueStep({ step: wardStep });

      const result = await questNodeDispatchLoopBroker({ isPlaying: (): boolean => true });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getRunWardCalls()).toStrictEqual([
        {
          questId: 'add-auth',
          workItemId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          mode: 'changed',
        },
      ]);
      expect(proxy.getSpawnBatchCalls()).toStrictEqual([]);
    });

    it('VALID: {spawn-agents step then idle} => spawns the batch then recurses to idle', async () => {
      const proxy = questNodeDispatchLoopBrokerProxy();
      const agents = [SpawnInstructionStub(), SpawnInstructionStub({ role: 'lawbringer' })];
      const spawnStep = NextStepStub({ type: 'spawn-agents', agents });
      proxy.queueStep({ step: spawnStep });

      const result = await questNodeDispatchLoopBroker({ isPlaying: (): boolean => true });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getSpawnBatchCalls()).toStrictEqual([{ agents }]);
      expect(proxy.getRunWardCalls()).toStrictEqual([]);
    });

    it('VALID: {registerProcess provided with spawn step} => threads registerProcess to the batch layer', async () => {
      const proxy = questNodeDispatchLoopBrokerProxy();
      const agents = [SpawnInstructionStub()];
      const spawnStep = NextStepStub({ type: 'spawn-agents', agents });
      proxy.queueStep({ step: spawnStep });
      const registerProcess = jest.fn();

      await questNodeDispatchLoopBroker({ isPlaying: (): boolean => true, registerProcess });

      expect(proxy.getSpawnBatchCalls()).toStrictEqual([{ agents, registerProcess }]);
    });

    it('VALID: {two spawn steps queued} => dispatches both batches before idling', async () => {
      const proxy = questNodeDispatchLoopBrokerProxy();
      const firstAgents = [SpawnInstructionStub()];
      const secondAgents = [SpawnInstructionStub({ role: 'blightwarden' })];
      proxy.queueStep({ step: NextStepStub({ type: 'spawn-agents', agents: firstAgents }) });
      proxy.queueStep({ step: NextStepStub({ type: 'spawn-agents', agents: secondAgents }) });

      await questNodeDispatchLoopBroker({ isPlaying: (): boolean => true });

      expect(proxy.getSpawnBatchCalls()).toStrictEqual([
        { agents: firstAgents },
        { agents: secondAgents },
      ]);
    });
  });
});
