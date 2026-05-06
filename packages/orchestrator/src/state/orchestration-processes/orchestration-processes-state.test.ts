import { ProcessIdStub, QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { orchestrationProcessesState } from './orchestration-processes-state';
import { orchestrationProcessesStateProxy } from './orchestration-processes-state.proxy';
import { OrchestrationProcessStub } from '../../contracts/orchestration-process/orchestration-process.stub';

describe('orchestrationProcessesState', () => {
  describe('register', () => {
    it('VALID: {orchestration process} => stores process in state', () => {
      const proxy = orchestrationProcessesStateProxy();
      proxy.setupEmpty();
      const orchestrationProcess = OrchestrationProcessStub();

      orchestrationProcessesState.register({ orchestrationProcess });

      const result = orchestrationProcessesState.get({
        processId: orchestrationProcess.processId,
      });

      expect(result).toStrictEqual({
        processId: 'proc-12345',
        questId: 'add-auth',
        kill: expect.any(Function),
      });
    });

    it('EDGE: {duplicate processId} => overwrites existing process', () => {
      const proxy = orchestrationProcessesStateProxy();
      proxy.setupEmpty();
      const processId = ProcessIdStub({ value: 'proc-dup' });
      const questId1 = QuestIdStub({ value: 'quest-old' });
      const questId2 = QuestIdStub({ value: 'quest-new' });

      orchestrationProcessesState.register({
        orchestrationProcess: { processId, questId: questId1, kill: jest.fn() },
      });
      orchestrationProcessesState.register({
        orchestrationProcess: { processId, questId: questId2, kill: jest.fn() },
      });

      const result = orchestrationProcessesState.get({ processId });

      expect(result?.questId).toBe('quest-new');
      expect(orchestrationProcessesState.getAll()).toStrictEqual(['proc-dup']);
    });
  });

  describe('get', () => {
    it('VALID: {existing processId} => returns process', () => {
      const proxy = orchestrationProcessesStateProxy();
      const orchestrationProcess = OrchestrationProcessStub();
      proxy.setupWithProcess({ orchestrationProcess });

      const result = orchestrationProcessesState.get({
        processId: orchestrationProcess.processId,
      });

      expect(result).toStrictEqual({
        processId: 'proc-12345',
        questId: 'add-auth',
        kill: expect.any(Function),
      });
    });

    it('EMPTY: {nonexistent processId} => returns undefined', () => {
      const proxy = orchestrationProcessesStateProxy();
      proxy.setupEmpty();
      const processId = ProcessIdStub({ value: 'nonexistent' });

      const result = orchestrationProcessesState.get({ processId });

      expect(result).toBe(undefined);
    });
  });

  describe('kill', () => {
    it('VALID: {registered process} => kills process, removes from state, returns true', () => {
      const proxy = orchestrationProcessesStateProxy();
      const processId = ProcessIdStub({ value: 'proc-kill-1' });
      const questId = QuestIdStub({ value: 'quest-kill-1' });
      const kill = jest.fn();
      proxy.setupWithProcessAndKill({ processId, questId, kill });

      const result = orchestrationProcessesState.kill({ processId });

      expect(result).toBe(true);
      expect(kill).toHaveBeenCalledTimes(1);
      expect(orchestrationProcessesState.has({ processId })).toBe(false);
    });

    it('EMPTY: {unknown processId} => returns false', () => {
      const proxy = orchestrationProcessesStateProxy();
      proxy.setupEmpty();
      const processId = ProcessIdStub({ value: 'nonexistent' });

      const result = orchestrationProcessesState.kill({ processId });

      expect(result).toBe(false);
    });
  });

  describe('killAll', () => {
    it('VALID: {multiple processes} => kills all and clears state', () => {
      const proxy = orchestrationProcessesStateProxy();
      proxy.setupEmpty();
      const kill1 = jest.fn();
      const kill2 = jest.fn();
      const processId1 = ProcessIdStub({ value: 'proc-1' });
      const processId2 = ProcessIdStub({ value: 'proc-2' });
      const questId1 = QuestIdStub({ value: 'quest-1' });
      const questId2 = QuestIdStub({ value: 'quest-2' });

      orchestrationProcessesState.register({
        orchestrationProcess: { processId: processId1, questId: questId1, kill: kill1 },
      });
      orchestrationProcessesState.register({
        orchestrationProcess: { processId: processId2, questId: questId2, kill: kill2 },
      });

      orchestrationProcessesState.killAll();

      expect(kill1).toHaveBeenCalledTimes(1);
      expect(kill2).toHaveBeenCalledTimes(1);
      expect(orchestrationProcessesState.has({ processId: processId1 })).toBe(false);
      expect(orchestrationProcessesState.has({ processId: processId2 })).toBe(false);
    });

    it('EMPTY: {no processes} => getAll returns empty array after killAll', () => {
      const proxy = orchestrationProcessesStateProxy();
      proxy.setupEmpty();

      orchestrationProcessesState.killAll();

      expect(orchestrationProcessesState.getAll()).toStrictEqual([]);
    });
  });

  describe('has', () => {
    it('VALID: {registered process} => returns true', () => {
      const proxy = orchestrationProcessesStateProxy();
      const orchestrationProcess = OrchestrationProcessStub();
      proxy.setupWithProcess({ orchestrationProcess });

      const result = orchestrationProcessesState.has({
        processId: orchestrationProcess.processId,
      });

      expect(result).toBe(true);
    });

    it('EMPTY: {unknown processId} => returns false', () => {
      const proxy = orchestrationProcessesStateProxy();
      proxy.setupEmpty();
      const processId = ProcessIdStub({ value: 'nonexistent' });

      const result = orchestrationProcessesState.has({ processId });

      expect(result).toBe(false);
    });
  });

  describe('findByQuestId', () => {
    it('VALID: {existing questId} => returns process', () => {
      const proxy = orchestrationProcessesStateProxy();
      const orchestrationProcess = OrchestrationProcessStub({ questId: 'find-quest' });
      proxy.setupWithProcess({ orchestrationProcess });

      const result = orchestrationProcessesState.findByQuestId({
        questId: orchestrationProcess.questId,
      });

      expect(result).toStrictEqual({
        processId: 'proc-12345',
        questId: 'find-quest',
        kill: expect.any(Function),
      });
    });

    it('EMPTY: {unknown questId} => returns undefined', () => {
      const proxy = orchestrationProcessesStateProxy();
      proxy.setupEmpty();
      const questId = QuestIdStub({ value: 'nonexistent' });

      const result = orchestrationProcessesState.findByQuestId({ questId });

      expect(result).toBe(undefined);
    });
  });

  describe('findByQuestWorkItemId', () => {
    it('VALID: {process registered with questWorkItemId} => returns the matching process', () => {
      const proxy = orchestrationProcessesStateProxy();
      proxy.setupEmpty();
      const processId = ProcessIdStub({ value: 'proc-launch-1' });
      const questId = QuestIdStub({ value: 'quest-launch-1' });
      const questWorkItemId = QuestWorkItemIdStub({
        value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
      const kill = jest.fn();

      orchestrationProcessesState.register({
        orchestrationProcess: { processId, questId, questWorkItemId, kill },
      });

      const result = orchestrationProcessesState.findByQuestWorkItemId({ questWorkItemId });

      expect(result).toStrictEqual({
        processId: 'proc-launch-1',
        questId: 'quest-launch-1',
        questWorkItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        kill: expect.any(Function),
      });
    });

    it('EMPTY: {process registered without questWorkItemId} => returns undefined for any lookup', () => {
      const proxy = orchestrationProcessesStateProxy();
      const orchestrationProcess = OrchestrationProcessStub({ questId: 'loop-only-quest' });
      proxy.setupWithProcess({ orchestrationProcess });
      const questWorkItemId = QuestWorkItemIdStub({
        value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      const result = orchestrationProcessesState.findByQuestWorkItemId({ questWorkItemId });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {unknown questWorkItemId} => returns undefined', () => {
      const proxy = orchestrationProcessesStateProxy();
      proxy.setupEmpty();
      const questWorkItemId = QuestWorkItemIdStub({
        value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      const result = orchestrationProcessesState.findByQuestWorkItemId({ questWorkItemId });

      expect(result).toBe(undefined);
    });
  });

  describe('findAllByQuestId', () => {
    it('VALID: {two processes share questId, one differs} => returns the matching pair in insertion order', () => {
      const proxy = orchestrationProcessesStateProxy();
      proxy.setupEmpty();
      const sharedQuestId = QuestIdStub({ value: 'shared-quest' });
      const otherQuestId = QuestIdStub({ value: 'other-quest' });
      const chatProcess = OrchestrationProcessStub({
        processId: ProcessIdStub({ value: 'chat-aaaa' }),
        questId: sharedQuestId,
        kill: jest.fn(),
      });
      const placeholderProcess = OrchestrationProcessStub({
        processId: ProcessIdStub({ value: 'proc-bbbb' }),
        questId: sharedQuestId,
        kill: jest.fn(),
      });
      const unrelatedProcess = OrchestrationProcessStub({
        processId: ProcessIdStub({ value: 'proc-queue-cccc' }),
        questId: otherQuestId,
        kill: jest.fn(),
      });
      orchestrationProcessesState.register({ orchestrationProcess: chatProcess });
      orchestrationProcessesState.register({ orchestrationProcess: unrelatedProcess });
      orchestrationProcessesState.register({ orchestrationProcess: placeholderProcess });

      const result = orchestrationProcessesState.findAllByQuestId({ questId: sharedQuestId });

      expect(result).toStrictEqual([
        {
          processId: 'chat-aaaa',
          questId: 'shared-quest',
          kill: expect.any(Function),
        },
        {
          processId: 'proc-bbbb',
          questId: 'shared-quest',
          kill: expect.any(Function),
        },
      ]);
    });

    it('EMPTY: {unknown questId} => returns empty array', () => {
      const proxy = orchestrationProcessesStateProxy();
      proxy.setupEmpty();
      const questId = QuestIdStub({ value: 'nonexistent' });

      const result = orchestrationProcessesState.findAllByQuestId({ questId });

      expect(result).toStrictEqual([]);
    });
  });

  describe('remove', () => {
    it('VALID: {existing process} => removes and returns true', () => {
      const proxy = orchestrationProcessesStateProxy();
      const orchestrationProcess = OrchestrationProcessStub();
      proxy.setupWithProcess({ orchestrationProcess });

      const removed = orchestrationProcessesState.remove({
        processId: orchestrationProcess.processId,
      });

      expect(removed).toBe(true);
      expect(orchestrationProcessesState.get({ processId: orchestrationProcess.processId })).toBe(
        undefined,
      );
    });

    it('EMPTY: {nonexistent processId} => returns false', () => {
      const proxy = orchestrationProcessesStateProxy();
      proxy.setupEmpty();
      const processId = ProcessIdStub({ value: 'nonexistent' });

      const removed = orchestrationProcessesState.remove({ processId });

      expect(removed).toBe(false);
    });
  });

  describe('getAll', () => {
    it('VALID: {multiple processes} => returns all processIds', () => {
      const proxy = orchestrationProcessesStateProxy();
      proxy.setupEmpty();
      const process1 = OrchestrationProcessStub({ processId: 'proc-1' });
      const process2 = OrchestrationProcessStub({ processId: 'proc-2' });
      orchestrationProcessesState.register({ orchestrationProcess: process1 });
      orchestrationProcessesState.register({ orchestrationProcess: process2 });

      const result = orchestrationProcessesState.getAll();

      expect(result).toStrictEqual(['proc-1', 'proc-2']);
    });

    it('EMPTY: {no processes} => returns empty array', () => {
      const proxy = orchestrationProcessesStateProxy();
      proxy.setupEmpty();

      const result = orchestrationProcessesState.getAll();

      expect(result).toStrictEqual([]);
    });
  });
});
