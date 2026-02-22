import { attachAgentIdsToEntriesTransformer } from './attach-agent-ids-to-entries-transformer';

const AssistantTaskEntry = ({ toolUseId }: { toolUseId: unknown }) => ({
  type: 'assistant',
  message: {
    content: [{ type: 'tool_use', name: 'Task', id: toolUseId }],
  },
});

const UserToolResultEntry = ({ toolUseId, agentId }: { toolUseId: unknown; agentId: unknown }) => ({
  type: 'user',
  toolUseResult: { agentId },
  message: {
    content: [{ type: 'tool_result', tool_use_id: toolUseId }],
  },
});

const UserToolResultEntryWithoutAgent = ({ toolUseId }: { toolUseId: unknown }) => ({
  type: 'user',
  message: {
    content: [{ type: 'tool_result', tool_use_id: toolUseId }],
  },
});

describe('attachAgentIdsToEntriesTransformer', () => {
  describe('when entries contain Task tool_use with matching tool_result agentId', () => {
    it('VALID: {assistant Task entry, user tool_result with agentId} => attaches agentId to assistant entry', () => {
      const assistantEntry = AssistantTaskEntry({ toolUseId: 'tool-1' });
      const userEntry = UserToolResultEntry({ toolUseId: 'tool-1', agentId: 'agent-abc' });
      const entries = [assistantEntry, userEntry];

      attachAgentIdsToEntriesTransformer({ entries });

      expect(Reflect.get(assistantEntry, 'agentId')).toBe('agent-abc');
    });
  });

  describe('when entries contain user tool_result with matching agentId', () => {
    it('VALID: {assistant Task entry, user tool_result with agentId} => attaches agentId to user entry', () => {
      const assistantEntry = AssistantTaskEntry({ toolUseId: 'tool-2' });
      const userEntry = UserToolResultEntry({ toolUseId: 'tool-2', agentId: 'agent-xyz' });
      const entries = [assistantEntry, userEntry];

      attachAgentIdsToEntriesTransformer({ entries });

      expect(Reflect.get(userEntry, 'agentId')).toBe('agent-xyz');
    });
  });

  describe('when entries have no toolUseResult with agentId', () => {
    it('EMPTY: {assistant Task entry, user tool_result without agentId} => does not attach agentId', () => {
      const assistantEntry = AssistantTaskEntry({ toolUseId: 'tool-3' });
      const userEntry = UserToolResultEntryWithoutAgent({ toolUseId: 'tool-3' });
      const entries = [assistantEntry, userEntry];

      attachAgentIdsToEntriesTransformer({ entries });

      expect(Reflect.get(assistantEntry, 'agentId')).toBeUndefined();
      expect(Reflect.get(userEntry, 'agentId')).toBeUndefined();
    });
  });

  describe('when entries array is empty', () => {
    it('EMPTY: {entries: []} => does not throw', () => {
      const entries: unknown[] = [];

      expect(() => {
        attachAgentIdsToEntriesTransformer({ entries });
      }).not.toThrow();
    });
  });
});
