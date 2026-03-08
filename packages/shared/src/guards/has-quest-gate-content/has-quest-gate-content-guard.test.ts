import { FlowStub } from '../../contracts/flow/flow.stub';
import { QuestStub } from '../../contracts/quest/quest.stub';
import { QuestStatusStub } from '../../contracts/quest-status/quest-status.stub';
import { hasQuestGateContentGuard } from './has-quest-gate-content-guard';

describe('hasQuestGateContentGuard', () => {
  describe('flows_approved gate', () => {
    it('VALID: {quest with flows, nextStatus: flows_approved} => returns true', () => {
      const quest = QuestStub({ flows: [FlowStub()] });
      const nextStatus = QuestStatusStub({ value: 'flows_approved' });

      const result = hasQuestGateContentGuard({ quest, nextStatus });

      expect(result).toBe(true);
    });

    it('INVALID_FLOWS: {quest with empty flows, nextStatus: flows_approved} => returns false', () => {
      const quest = QuestStub({ flows: [] });
      const nextStatus = QuestStatusStub({ value: 'flows_approved' });

      const result = hasQuestGateContentGuard({ quest, nextStatus });

      expect(result).toBe(false);
    });
  });

  describe('approved gate', () => {
    it('VALID: {quest with flows, nextStatus: approved} => returns true', () => {
      const quest = QuestStub({ flows: [FlowStub()] });
      const nextStatus = QuestStatusStub({ value: 'approved' });

      const result = hasQuestGateContentGuard({ quest, nextStatus });

      expect(result).toBe(true);
    });

    it('INVALID_FLOWS: {quest with empty flows, nextStatus: approved} => returns false', () => {
      const quest = QuestStub({ flows: [] });
      const nextStatus = QuestStatusStub({ value: 'approved' });

      const result = hasQuestGateContentGuard({ quest, nextStatus });

      expect(result).toBe(false);
    });
  });

  describe('design_approved gate', () => {
    it('VALID: {quest with flows, nextStatus: design_approved} => returns true', () => {
      const quest = QuestStub({ flows: [FlowStub()] });
      const nextStatus = QuestStatusStub({ value: 'design_approved' });

      const result = hasQuestGateContentGuard({ quest, nextStatus });

      expect(result).toBe(true);
    });

    it('INVALID_FLOWS: {quest with empty flows, nextStatus: design_approved} => returns false', () => {
      const quest = QuestStub({ flows: [] });
      const nextStatus = QuestStatusStub({ value: 'design_approved' });

      const result = hasQuestGateContentGuard({ quest, nextStatus });

      expect(result).toBe(false);
    });
  });

  describe('non-gated transitions', () => {
    it('VALID: {nextStatus: in_progress} => returns true', () => {
      const quest = QuestStub();
      const nextStatus = QuestStatusStub({ value: 'in_progress' });

      const result = hasQuestGateContentGuard({ quest, nextStatus });

      expect(result).toBe(true);
    });

    it('VALID: {nextStatus: complete} => returns true', () => {
      const quest = QuestStub();
      const nextStatus = QuestStatusStub({ value: 'complete' });

      const result = hasQuestGateContentGuard({ quest, nextStatus });

      expect(result).toBe(true);
    });

    it('VALID: {nextStatus: pending} => returns true', () => {
      const quest = QuestStub();
      const nextStatus = QuestStatusStub({ value: 'pending' });

      const result = hasQuestGateContentGuard({ quest, nextStatus });

      expect(result).toBe(true);
    });

    it('VALID: {nextStatus: explore_design} => returns true', () => {
      const quest = QuestStub();
      const nextStatus = QuestStatusStub({ value: 'explore_design' });

      const result = hasQuestGateContentGuard({ quest, nextStatus });

      expect(result).toBe(true);
    });

    it('VALID: {nextStatus: review_design} => returns true', () => {
      const quest = QuestStub();
      const nextStatus = QuestStatusStub({ value: 'review_design' });

      const result = hasQuestGateContentGuard({ quest, nextStatus });

      expect(result).toBe(true);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {quest: undefined} => returns false', () => {
      const nextStatus = QuestStatusStub({ value: 'approved' });

      const result = hasQuestGateContentGuard({ nextStatus });

      expect(result).toBe(false);
    });

    it('EMPTY: {nextStatus: undefined} => returns false', () => {
      const quest = QuestStub();

      const result = hasQuestGateContentGuard({ quest });

      expect(result).toBe(false);
    });

    it('EMPTY: {both undefined} => returns false', () => {
      const result = hasQuestGateContentGuard({});

      expect(result).toBe(false);
    });
  });
});
