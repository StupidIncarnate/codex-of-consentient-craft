import {
  ContextStub,
  ObservableStub,
  QuestStub,
  QuestTaskStub,
  ObservableIdStub,
} from '@dungeonmaster/shared/contracts';

import { isQuestReadyForPathseekerGuard } from './is-quest-ready-for-pathseeker-guard';

describe('isQuestReadyForPathseekerGuard', () => {
  describe('valid quests', () => {
    it('VALID: {quest with observables, tasks with observableIds} => returns true', () => {
      const observableId = ObservableIdStub();
      const observable = ObservableStub({ id: observableId });
      const task = QuestTaskStub({ observableIds: [observableId] });
      const quest = QuestStub({
        observables: [observable],
        tasks: [task],
      });

      const result = isQuestReadyForPathseekerGuard({ quest });

      expect(result).toBe(true);
    });

    it('VALID: {multiple tasks all with observableIds} => returns true', () => {
      const observableId1 = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const observableId2 = ObservableIdStub({ value: 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e' });
      const observable1 = ObservableStub({ id: observableId1 });
      const observable2 = ObservableStub({ id: observableId2 });
      const task1 = QuestTaskStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        observableIds: [observableId1],
      });
      const task2 = QuestTaskStub({
        id: 'a47bc10b-58cc-4372-a567-0e02b2c3d480',
        observableIds: [observableId2],
      });
      const quest = QuestStub({
        observables: [observable1, observable2],
        tasks: [task1, task2],
      });

      const result = isQuestReadyForPathseekerGuard({ quest });

      expect(result).toBe(true);
    });

    it('EDGE: {single task with single observableId} => returns true', () => {
      const observableId = ObservableIdStub();
      const observable = ObservableStub({ id: observableId });
      const task = QuestTaskStub({ observableIds: [observableId] });
      const quest = QuestStub({
        observables: [observable],
        tasks: [task],
      });

      const result = isQuestReadyForPathseekerGuard({ quest });

      expect(result).toBe(true);
    });
  });

  describe('invalid quests', () => {
    it('EMPTY: {quest with empty observables[]} => returns false', () => {
      const observableId = ObservableIdStub();
      const task = QuestTaskStub({ observableIds: [observableId] });
      const quest = QuestStub({
        observables: [],
        tasks: [task],
      });

      const result = isQuestReadyForPathseekerGuard({ quest });

      expect(result).toBe(false);
    });

    it('EMPTY: {quest with empty tasks[]} => returns false', () => {
      const observable = ObservableStub();
      const quest = QuestStub({
        observables: [observable],
        tasks: [],
      });

      const result = isQuestReadyForPathseekerGuard({ quest });

      expect(result).toBe(false);
    });

    it('INVALID_TASK: {task with empty observableIds[]} => returns false', () => {
      const observable = ObservableStub();
      const task = QuestTaskStub({ observableIds: [] });
      const quest = QuestStub({
        observables: [observable],
        tasks: [task],
      });

      const result = isQuestReadyForPathseekerGuard({ quest });

      expect(result).toBe(false);
    });

    it('EDGE: {quest with contexts but no observables} => returns false', () => {
      const observableId = ObservableIdStub();
      const task = QuestTaskStub({ observableIds: [observableId] });
      const context = ContextStub();
      const quest = QuestStub({
        contexts: [context],
        observables: [],
        tasks: [task],
      });

      const result = isQuestReadyForPathseekerGuard({ quest });

      expect(result).toBe(false);
    });

    it('INVALID_TASK: {one task with observableIds, one without} => returns false', () => {
      const observableId = ObservableIdStub();
      const observable = ObservableStub({ id: observableId });
      const taskWithObservable = QuestTaskStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        observableIds: [observableId],
      });
      const taskWithoutObservable = QuestTaskStub({
        id: 'a47bc10b-58cc-4372-a567-0e02b2c3d480',
        observableIds: [],
      });
      const quest = QuestStub({
        observables: [observable],
        tasks: [taskWithObservable, taskWithoutObservable],
      });

      const result = isQuestReadyForPathseekerGuard({ quest });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {quest: undefined} => returns false', () => {
      const result = isQuestReadyForPathseekerGuard({});

      expect(result).toBe(false);
    });
  });
});
