import { ContextStub, ObservableStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { isQuestReadyForPathseekerGuard } from './is-quest-ready-for-pathseeker-guard';

describe('isQuestReadyForPathseekerGuard', () => {
  describe('valid quests', () => {
    it('VALID: {quest with observables} => returns true', () => {
      const observable = ObservableStub();
      const quest = QuestStub({
        observables: [observable],
      });

      const result = isQuestReadyForPathseekerGuard({ quest });

      expect(result).toBe(true);
    });

    it('VALID: {multiple observables} => returns true', () => {
      const observable1 = ObservableStub({ id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const observable2 = ObservableStub({ id: 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e' });
      const quest = QuestStub({
        observables: [observable1, observable2],
      });

      const result = isQuestReadyForPathseekerGuard({ quest });

      expect(result).toBe(true);
    });

    it('EDGE: {single observable} => returns true', () => {
      const observable = ObservableStub();
      const quest = QuestStub({
        observables: [observable],
      });

      const result = isQuestReadyForPathseekerGuard({ quest });

      expect(result).toBe(true);
    });
  });

  describe('invalid quests', () => {
    it('EMPTY: {quest with empty observables[]} => returns false', () => {
      const quest = QuestStub({
        observables: [],
      });

      const result = isQuestReadyForPathseekerGuard({ quest });

      expect(result).toBe(false);
    });

    it('EDGE: {quest with contexts but no observables} => returns false', () => {
      const context = ContextStub();
      const quest = QuestStub({
        contexts: [context],
        observables: [],
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
