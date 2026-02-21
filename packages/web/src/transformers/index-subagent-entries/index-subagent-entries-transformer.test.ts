import {
  AssistantToolUseChatEntryStub,
  UserChatEntryStub,
} from '../../contracts/chat-entry/chat-entry.stub';
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
});
