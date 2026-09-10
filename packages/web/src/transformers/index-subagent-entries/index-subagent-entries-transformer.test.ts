import {
  AssistantToolUseChatEntryStub,
  TaskNotificationChatEntryStub,
  UserChatEntryStub,
} from '@dungeonmaster/shared/contracts';
import { indexSubagentEntriesTransformer } from './index-subagent-entries-transformer';

describe('indexSubagentEntriesTransformer', () => {
  describe('empty entries', () => {
    it('EMPTY: {entries: []} => returns empty map', () => {
      const result = indexSubagentEntriesTransformer({ entries: [] });

      expect(result.size).toBe(0);
    });
  });

  describe('subagent entries', () => {
    it('VALID: {entries with subagent source and agentId} => groups by agentId', () => {
      const entry1 = AssistantToolUseChatEntryStub({ source: 'subagent', agentId: 'agent-001' });
      const entry2 = AssistantToolUseChatEntryStub({ source: 'subagent', agentId: 'agent-001' });
      const entry3 = AssistantToolUseChatEntryStub({ source: 'subagent', agentId: 'agent-002' });

      const result = indexSubagentEntriesTransformer({ entries: [entry1, entry2, entry3] });

      expect(result.size).toBe(2);
      expect(result.get('agent-001' as never)).toStrictEqual([entry1, entry2]);
      expect(result.get('agent-002' as never)).toStrictEqual([entry3]);
    });
  });

  describe('non-subagent entries', () => {
    it('VALID: {entries without subagent source} => returns empty map', () => {
      const entry = UserChatEntryStub();

      const result = indexSubagentEntriesTransformer({ entries: [entry] });

      expect(result.size).toBe(0);
    });
  });

  describe('task_notification exclusion', () => {
    it('VALID: {task_notification entry with subagent source and agentId} => excluded from the map', () => {
      // A nested chain's own completion notification is read from the dispatching sub-agent's
      // transcript file, so it carries source: 'subagent' and an agentId exactly like a real
      // sub-agent tool entry. Bucketing it here would mark it `consumed` before
      // collectSubagentChainsTransformer's own notification search runs, permanently losing it as
      // `group.taskNotification`.
      const notification = TaskNotificationChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
      });

      const result = indexSubagentEntriesTransformer({ entries: [notification] });

      expect(result.size).toBe(0);
    });

    it('VALID: {task_notification entry mixed with a real subagent entry, same agentId} => only the real entry is indexed', () => {
      const notification = TaskNotificationChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
      });
      const toolUse = AssistantToolUseChatEntryStub({ source: 'subagent', agentId: 'agent-001' });

      const result = indexSubagentEntriesTransformer({ entries: [notification, toolUse] });

      expect(result.size).toBe(1);
      expect(result.get('agent-001' as never)).toStrictEqual([toolUse]);
    });
  });
});
