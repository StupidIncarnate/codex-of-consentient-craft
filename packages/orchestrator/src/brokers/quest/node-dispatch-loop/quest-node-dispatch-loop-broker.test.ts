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

      const result = await questNodeDispatchLoopBroker({
        isPlaying: (): boolean => false,
        onWardLine: () => undefined,
      });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getNextStepCalls()).toStrictEqual([]);
    });

    it('VALID: {pause flips after first dispatch} => in-flight batch finishes, nothing new dispatches', async () => {
      const proxy = questNodeDispatchLoopBrokerProxy();
      const agents = [SpawnInstructionStub()];
      const spawnStep = NextStepStub({ type: 'spawn-agents', agents });
      proxy.queueStep({ step: spawnStep });
      proxy.queueStep({ step: spawnStep });
      // Two reads per iteration — once before the scan, once after it — so the first iteration
      // needs BOTH true to dispatch; the pause lands before the second iteration's first read.
      const isPlaying = jest
        .fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValue(false);

      const result = await questNodeDispatchLoopBroker({ isPlaying, onWardLine: () => undefined });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getSpawnBatchCalls()).toStrictEqual([{ agents, isPlaying }]);
      expect(proxy.getNextStepCalls()).toStrictEqual([
        {
          activeQuest: { setActive: expect.any(Function), clear: expect.any(Function) },
          longPollTotalMs: orchestrationDispatchStatics.loop.longPollTotalMs,
          longPollIntervalMs: orchestrationDispatchStatics.loop.longPollIntervalMs,
          shouldKeepPolling: expect.any(Function),
        },
      ]);
    });

    // The scan is a LONG POLL: it sits waiting for work for up to `longPollTotalMs`, and a quest
    // seeded during that wait is what it eventually returns. A pause pressed inside that window
    // must win — the work the poll found was found AFTER the dispatcher was told to stop.
    it('VALID: {pause lands while the scan long-polls, then the scan returns ward work} => the ward never runs', async () => {
      const proxy = questNodeDispatchLoopBrokerProxy();
      proxy.queueStep({
        step: NextStepStub({
          type: 'run-ward',
          questId: 'add-auth',
          workItemId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          mode: 'changed',
        } as never),
      });
      const isPlaying = jest.fn().mockReturnValueOnce(true).mockReturnValue(false);

      const result = await questNodeDispatchLoopBroker({ isPlaying, onWardLine: () => undefined });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getRunWardCalls()).toStrictEqual([]);
      expect(proxy.getSpawnBatchCalls()).toStrictEqual([]);
    });

    it('VALID: {pause lands while the scan long-polls, then the scan returns agent work} => no batch spawns', async () => {
      const proxy = questNodeDispatchLoopBrokerProxy();
      const agents = [SpawnInstructionStub()];
      proxy.queueStep({ step: NextStepStub({ type: 'spawn-agents', agents }) });
      const isPlaying = jest.fn().mockReturnValueOnce(true).mockReturnValue(false);

      const result = await questNodeDispatchLoopBroker({ isPlaying, onWardLine: () => undefined });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getSpawnBatchCalls()).toStrictEqual([]);
      expect(proxy.getRunWardCalls()).toStrictEqual([]);
    });
  });

  describe('dispatch switch', () => {
    it('VALID: {idle step} => returns ok after one scan', async () => {
      const proxy = questNodeDispatchLoopBrokerProxy();

      const result = await questNodeDispatchLoopBroker({
        isPlaying: (): boolean => true,
        onWardLine: () => undefined,
      });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getNextStepCalls()).toStrictEqual([
        {
          activeQuest: { setActive: expect.any(Function), clear: expect.any(Function) },
          longPollTotalMs: orchestrationDispatchStatics.loop.longPollTotalMs,
          longPollIntervalMs: orchestrationDispatchStatics.loop.longPollIntervalMs,
          shouldKeepPolling: expect.any(Function),
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

      const result = await questNodeDispatchLoopBroker({
        isPlaying: (): boolean => true,
        onWardLine: () => undefined,
      });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getRunWardCalls()).toStrictEqual([
        {
          questId: 'add-auth',
          workItemId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          mode: 'changed',
          // Ward's only route to a UI — the loop must hand it down, never drop it.
          onLine: expect.any(Function),
        },
      ]);
      expect(proxy.getSpawnBatchCalls()).toStrictEqual([]);
    });

    it('VALID: {spawn-agents step then idle} => spawns the batch then recurses to idle', async () => {
      const proxy = questNodeDispatchLoopBrokerProxy();
      const agents = [SpawnInstructionStub(), SpawnInstructionStub({ role: 'lawbringer' })];
      const spawnStep = NextStepStub({ type: 'spawn-agents', agents });
      proxy.queueStep({ step: spawnStep });
      const isPlaying = jest.fn().mockReturnValue(true);

      const result = await questNodeDispatchLoopBroker({
        isPlaying,
        onWardLine: () => undefined,
      });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getSpawnBatchCalls()).toStrictEqual([{ agents, isPlaying }]);
      expect(proxy.getRunWardCalls()).toStrictEqual([]);
    });

    it('VALID: {registerProcess provided with spawn step} => threads registerProcess to the batch layer', async () => {
      const proxy = questNodeDispatchLoopBrokerProxy();
      const agents = [SpawnInstructionStub()];
      const spawnStep = NextStepStub({ type: 'spawn-agents', agents });
      proxy.queueStep({ step: spawnStep });
      const registerProcess = jest.fn();
      const isPlaying = jest.fn().mockReturnValue(true);

      await questNodeDispatchLoopBroker({
        isPlaying,
        onWardLine: () => undefined,
        registerProcess,
      });

      expect(proxy.getSpawnBatchCalls()).toStrictEqual([{ agents, isPlaying, registerProcess }]);
    });

    it('VALID: {unregisterProcess provided with spawn step} => threads unregisterProcess to the batch layer', async () => {
      const proxy = questNodeDispatchLoopBrokerProxy();
      const agents = [SpawnInstructionStub()];
      const spawnStep = NextStepStub({ type: 'spawn-agents', agents });
      proxy.queueStep({ step: spawnStep });
      const unregisterProcess = jest.fn();
      const isPlaying = jest.fn().mockReturnValue(true);

      await questNodeDispatchLoopBroker({
        isPlaying,
        onWardLine: () => undefined,
        unregisterProcess,
      });

      expect(proxy.getSpawnBatchCalls()).toStrictEqual([{ agents, isPlaying, unregisterProcess }]);
    });

    it('VALID: {two spawn steps queued} => dispatches both batches before idling', async () => {
      const proxy = questNodeDispatchLoopBrokerProxy();
      const firstAgents = [SpawnInstructionStub()];
      const secondAgents = [SpawnInstructionStub({ role: 'blightwarden' })];
      proxy.queueStep({ step: NextStepStub({ type: 'spawn-agents', agents: firstAgents }) });
      proxy.queueStep({ step: NextStepStub({ type: 'spawn-agents', agents: secondAgents }) });
      const isPlaying = jest.fn().mockReturnValue(true);

      await questNodeDispatchLoopBroker({
        isPlaying,
        onWardLine: () => undefined,
      });

      expect(proxy.getSpawnBatchCalls()).toStrictEqual([
        { agents: firstAgents, isPlaying },
        { agents: secondAgents, isPlaying },
      ]);
    });
  });
});
