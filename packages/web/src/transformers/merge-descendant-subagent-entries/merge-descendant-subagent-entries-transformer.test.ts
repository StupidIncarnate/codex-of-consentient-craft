import {
  AssistantTextChatEntryStub,
  TaskToolUseChatEntryStub,
  UserChatEntryStub,
} from '@dungeonmaster/shared/contracts';
import { mergeDescendantSubagentEntriesTransformer } from './merge-descendant-subagent-entries-transformer';

describe('mergeDescendantSubagentEntriesTransformer', () => {
  describe('no descendant chains to seed', () => {
    it('EMPTY: {ownEntries: [], poolEntries: []} => returns []', () => {
      const result = mergeDescendantSubagentEntriesTransformer({
        ownEntries: [],
        poolEntries: [],
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {ownEntries with no Task tool_use lines} => returns ownEntries unchanged', () => {
      const userEntry = UserChatEntryStub();
      const textEntry = AssistantTextChatEntryStub();

      const result = mergeDescendantSubagentEntriesTransformer({
        ownEntries: [userEntry, textEntry],
        poolEntries: [
          AssistantTextChatEntryStub({ source: 'subagent', agentId: 'minion-1', content: 'x' }),
        ],
      });

      expect(result).toStrictEqual([userEntry, textEntry]);
    });

    it('EDGE: {Task tool_use in ownEntries with empty agentId} => not seeded, returns ownEntries', () => {
      const taskNoAgent = TaskToolUseChatEntryStub();
      const orphanPoolEntry = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'minion-1',
        content: 'never pulled',
      });

      const result = mergeDescendantSubagentEntriesTransformer({
        ownEntries: [taskNoAgent],
        poolEntries: [orphanPoolEntry],
      });

      expect(result).toStrictEqual([taskNoAgent]);
    });
  });

  describe('descendant entries pulled from the pool', () => {
    it('VALID: {Task spawns minion-1, minion entries only in pool} => appends descendant entries after ownEntries', () => {
      const taskMinion = TaskToolUseChatEntryStub({ agentId: 'minion-1' });
      const m1 = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'minion-1',
        content: 'm1',
      });
      const m2 = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'minion-1',
        content: 'm2',
      });

      const result = mergeDescendantSubagentEntriesTransformer({
        ownEntries: [taskMinion],
        poolEntries: [taskMinion, m1, m2],
      });

      expect(result).toStrictEqual([taskMinion, m1, m2]);
    });

    it('EDGE: {descendant already present in ownEntries} => not duplicated', () => {
      const taskMinion = TaskToolUseChatEntryStub({ agentId: 'minion-1' });
      const m1 = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'minion-1',
        content: 'm1',
      });
      const m2 = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'minion-1',
        content: 'm2',
      });

      const result = mergeDescendantSubagentEntriesTransformer({
        ownEntries: [taskMinion, m1],
        poolEntries: [taskMinion, m1, m2],
      });

      expect(result).toStrictEqual([taskMinion, m1, m2]);
    });

    it('VALID: {minion spawns a nested sub-agent via parentAgentId} => grandchild entries pulled with no depth cap', () => {
      const taskMinion = TaskToolUseChatEntryStub({ agentId: 'minion-1' });
      const m1 = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'minion-1',
        content: 'm1',
      });
      const taskSub = TaskToolUseChatEntryStub({
        agentId: 'sub-1',
        parentAgentId: 'minion-1',
        source: 'subagent',
      });
      const s1 = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'sub-1',
        content: 's1',
      });

      const result = mergeDescendantSubagentEntriesTransformer({
        ownEntries: [taskMinion],
        poolEntries: [m1, taskSub, s1],
      });

      expect(result).toStrictEqual([taskMinion, m1, taskSub, s1]);
    });
  });

  describe('non-descendant pool entries excluded', () => {
    it('VALID: {sibling sub-agent entry with unrelated agentId} => excluded, returns ownEntries', () => {
      const taskMinion = TaskToolUseChatEntryStub({ agentId: 'minion-1' });
      const sibling = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'other-9',
        content: 'sibling',
      });

      const result = mergeDescendantSubagentEntriesTransformer({
        ownEntries: [taskMinion],
        poolEntries: [sibling],
      });

      expect(result).toStrictEqual([taskMinion]);
    });

    it('EDGE: {pool entry with no agentId and no parentAgentId} => excluded, returns ownEntries', () => {
      const taskMinion = TaskToolUseChatEntryStub({ agentId: 'minion-1' });
      const plainText = AssistantTextChatEntryStub({ content: 'plain session text' });

      const result = mergeDescendantSubagentEntriesTransformer({
        ownEntries: [taskMinion],
        poolEntries: [plainText],
      });

      expect(result).toStrictEqual([taskMinion]);
    });
  });
});
