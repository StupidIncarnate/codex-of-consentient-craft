import { hasResumableChatSessionGuard } from './has-resumable-chat-session-guard';
import { QuestStub } from '../../contracts/quest/quest.stub';
import { SessionIdStub } from '../../contracts/session-id/session-id.stub';
import { WorkItemStub } from '../../contracts/work-item/work-item.stub';

describe('hasResumableChatSessionGuard', () => {
  describe('empty inputs', () => {
    it('EMPTY: {quest: undefined} => returns false', () => {
      const result = hasResumableChatSessionGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {quest.workItems: []} => returns false', () => {
      const quest = QuestStub({ workItems: [] });

      const result = hasResumableChatSessionGuard({ quest });

      expect(result).toBe(false);
    });
  });

  describe('chat roles with a sessionId', () => {
    it('VALID: {workItems: [chaoswhisperer with sessionId]} => returns true', () => {
      const quest = QuestStub({
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId: SessionIdStub() })],
      });

      const result = hasResumableChatSessionGuard({ quest });

      expect(result).toBe(true);
    });

    it('VALID: {workItems: [glyphsmith with sessionId]} => returns true', () => {
      const quest = QuestStub({
        workItems: [WorkItemStub({ role: 'glyphsmith', sessionId: SessionIdStub() })],
      });

      const result = hasResumableChatSessionGuard({ quest });

      expect(result).toBe(true);
    });

    it('VALID: {workItems: [bughunt with sessionId]} => returns true', () => {
      const quest = QuestStub({
        workItems: [WorkItemStub({ role: 'bughunt', sessionId: SessionIdStub() })],
      });

      const result = hasResumableChatSessionGuard({ quest });

      expect(result).toBe(true);
    });
  });

  describe('chat roles without a matching sessionId', () => {
    it('INVALID: {workItems: [chaoswhisperer without sessionId]} => returns false', () => {
      const quest = QuestStub({ workItems: [WorkItemStub({ role: 'chaoswhisperer' })] });

      const result = hasResumableChatSessionGuard({ quest });

      expect(result).toBe(false);
    });

    it('INVALID: {workItems: [codeweaver with sessionId]} => returns false', () => {
      const quest = QuestStub({
        workItems: [WorkItemStub({ role: 'codeweaver', sessionId: SessionIdStub() })],
      });

      const result = hasResumableChatSessionGuard({ quest });

      expect(result).toBe(false);
    });
  });

  describe('mixed work item lists', () => {
    it('VALID: {workItems: [non-chat item, glyphsmith with sessionId]} => returns true', () => {
      const quest = QuestStub({
        workItems: [
          WorkItemStub({ role: 'codeweaver' }),
          WorkItemStub({ role: 'glyphsmith', sessionId: SessionIdStub() }),
        ],
      });

      const result = hasResumableChatSessionGuard({ quest });

      expect(result).toBe(true);
    });
  });
});
