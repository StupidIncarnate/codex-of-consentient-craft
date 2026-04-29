import {
  AssistantToolUseStreamLineStub,
  AssistantTextStreamLineStub,
  AssistantThinkingStreamLineStub,
  AssistantRedactedThinkingStreamLineStub,
  AssistantToolResultStreamLineStub,
} from '@dungeonmaster/shared/contracts';

import { ToolUseIdStub } from '../../contracts/tool-use-id/tool-use-id.stub';
import { contentItemAgentIdAtIndexTransformer } from '../content-item-agent-id-at-index/content-item-agent-id-at-index-transformer';
import { contentItemAgentIdSetAtIndexTransformer } from '../content-item-agent-id-set-at-index/content-item-agent-id-set-at-index-transformer';
import { taskToolUseIdsFromContentTransformer } from './task-tool-use-ids-from-content-transformer';

const getContentItemAgentId = ({ entry, index }: { entry: { message?: unknown }; index: number }) =>
  contentItemAgentIdAtIndexTransformer({ entry, index });

const setContentItemAgentId = ({
  entry,
  index,
  value,
}: {
  entry: { message?: unknown };
  index: number;
  value: string;
}) => {
  contentItemAgentIdSetAtIndexTransformer({ entry, index, value });
};

const AssistantTaskEntry = ({ toolUseId }: { toolUseId: string }) => ({
  ...AssistantToolUseStreamLineStub({
    message: {
      role: 'assistant',
      content: [{ type: 'tool_use', id: toolUseId, name: 'Task', input: {} }],
    },
  } as Parameters<typeof AssistantToolUseStreamLineStub>[0]),
});

const AssistantAgentEntry = ({ toolUseId }: { toolUseId: string }) => ({
  ...AssistantToolUseStreamLineStub({
    message: {
      role: 'assistant',
      content: [{ type: 'tool_use', id: toolUseId, name: 'Agent', input: {} }],
    },
  } as Parameters<typeof AssistantToolUseStreamLineStub>[0]),
});

const AssistantReadToolEntry = ({ toolUseId }: { toolUseId: string }) => ({
  ...AssistantToolUseStreamLineStub({
    message: {
      role: 'assistant',
      content: [{ type: 'tool_use', id: toolUseId, name: 'Read', input: { file_path: '/a' } }],
    },
  } as Parameters<typeof AssistantToolUseStreamLineStub>[0]),
});

const AssistantNonTaskToolEntry = ({ toolUseId }: { toolUseId: string }) => ({
  ...AssistantToolUseStreamLineStub({
    message: {
      role: 'assistant',
      content: [{ type: 'tool_use', id: toolUseId, name: 'Bash', input: { command: 'ls' } }],
    },
  } as Parameters<typeof AssistantToolUseStreamLineStub>[0]),
});

const AssistantMultipleTaskEntry = ({
  toolUseId1,
  toolUseId2,
}: {
  toolUseId1: string;
  toolUseId2: string;
}) => ({
  ...AssistantToolUseStreamLineStub({
    message: {
      role: 'assistant',
      content: [
        { type: 'tool_use', id: toolUseId1, name: 'Task', input: {} },
        { type: 'tool_use', id: toolUseId2, name: 'Task', input: {} },
      ],
    },
  } as Parameters<typeof AssistantToolUseStreamLineStub>[0]),
});

const AssistantMixedAgentTaskEntry = ({
  toolUseId1,
  toolUseId2,
}: {
  toolUseId1: string;
  toolUseId2: string;
}) => ({
  ...AssistantToolUseStreamLineStub({
    message: {
      role: 'assistant',
      content: [
        { type: 'tool_use', id: toolUseId1, name: 'Task', input: {} },
        { type: 'tool_use', id: toolUseId2, name: 'Agent', input: {} },
      ],
    },
  } as Parameters<typeof AssistantToolUseStreamLineStub>[0]),
});

const AssistantMixedTaskAndReadEntry = ({
  taskId,
  readId,
}: {
  taskId: string;
  readId: string;
}) => ({
  ...AssistantToolUseStreamLineStub({
    message: {
      role: 'assistant',
      content: [
        { type: 'tool_use', id: taskId, name: 'Task', input: {} },
        { type: 'tool_use', id: readId, name: 'Read', input: { file_path: '/a' } },
      ],
    },
  } as Parameters<typeof AssistantToolUseStreamLineStub>[0]),
});

const AssistantThinkingEntry = () => ({
  ...AssistantThinkingStreamLineStub(),
});

const AssistantRedactedThinkingEntry = () => ({
  ...AssistantRedactedThinkingStreamLineStub(),
});

const AssistantToolResultEntry = ({ toolUseId }: { toolUseId: string }) => ({
  ...AssistantToolResultStreamLineStub({
    message: {
      role: 'assistant',
      content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
    },
  } as Parameters<typeof AssistantToolResultStreamLineStub>[0]),
});

const EntryWithoutMessage = () => ({
  type: 'assistant' as const,
});

const EntryWithMessageNoContent = () => ({
  type: 'assistant' as const,
  message: { role: 'assistant' as const },
});

const EntryWithNullMessage = () => ({
  type: 'assistant' as const,
  message: null,
});

const EntryWithNullContentItem = () => ({
  message: { content: [null] },
});

const TaskToolUseWithoutId = () => ({
  message: {
    content: [{ type: 'tool_use' as const, name: 'Task', input: {} }],
  },
});

const TaskToolUseWithNumericId = () => ({
  message: {
    content: [{ type: 'tool_use' as const, name: 'Task', id: 123, input: {} }],
  },
});

describe('taskToolUseIdsFromContentTransformer', () => {
  describe('valid extraction + stamping', () => {
    it('VALID: {assistant entry with Task tool_use} => returns id and stamps agentId on the item', () => {
      const toolUseId = ToolUseIdStub({ value: 'toolu_task_01' });
      const entry = AssistantTaskEntry({ toolUseId });

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual(['toolu_task_01']);
      expect(getContentItemAgentId({ entry, index: 0 })).toBe('toolu_task_01');
    });

    it('VALID: {assistant entry with Agent tool_use} => returns id and stamps agentId on the item', () => {
      const toolUseId = ToolUseIdStub({ value: 'toolu_agent_01' });
      const entry = AssistantAgentEntry({ toolUseId });

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual(['toolu_agent_01']);
      expect(getContentItemAgentId({ entry, index: 0 })).toBe('toolu_agent_01');
    });
  });

  describe('non-Task/Agent tool_use', () => {
    it('VALID: {assistant entry with Read tool_use} => returns empty and does NOT stamp agentId', () => {
      const toolUseId = ToolUseIdStub({ value: 'toolu_read_01' });
      const entry = AssistantReadToolEntry({ toolUseId });

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
      expect(getContentItemAgentId({ entry, index: 0 })).toBe(undefined);
    });

    it('VALID: {assistant entry with Bash tool_use} => returns empty and does NOT stamp agentId', () => {
      const toolUseId = ToolUseIdStub({ value: 'toolu_bash_01' });
      const entry = AssistantNonTaskToolEntry({ toolUseId });

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
      expect(getContentItemAgentId({ entry, index: 0 })).toBe(undefined);
    });

    it('VALID: {mixed Task and Read items} => only Task is returned and only Task is stamped', () => {
      const taskId = ToolUseIdStub({ value: 'toolu_task_mix' });
      const readId = ToolUseIdStub({ value: 'toolu_read_mix' });
      const entry = AssistantMixedTaskAndReadEntry({ taskId, readId });

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual(['toolu_task_mix']);
      expect(getContentItemAgentId({ entry, index: 0 })).toBe('toolu_task_mix');
      expect(getContentItemAgentId({ entry, index: 1 })).toBe(undefined);
    });

    it('EMPTY: {assistant text entry without tool_use items} => returns empty array', () => {
      const entry = AssistantTextStreamLineStub();

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });
  });

  describe('pre-existing agentId handling', () => {
    it('EDGE: {Task item already has non-empty agentId} => preserves existing, does NOT overwrite, still returns id', () => {
      const toolUseId = ToolUseIdStub({ value: 'toolu_task_pre' });
      const entry = AssistantTaskEntry({ toolUseId });
      setContentItemAgentId({ entry, index: 0, value: 'pre-existing' });

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual(['toolu_task_pre']);
      expect(getContentItemAgentId({ entry, index: 0 })).toBe('pre-existing');
    });

    it('EDGE: {Task item has empty-string agentId} => overwrites with id and returns id', () => {
      const toolUseId = ToolUseIdStub({ value: 'toolu_task_empty' });
      const entry = AssistantTaskEntry({ toolUseId });
      setContentItemAgentId({ entry, index: 0, value: '' });

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual(['toolu_task_empty']);
      expect(getContentItemAgentId({ entry, index: 0 })).toBe('toolu_task_empty');
    });
  });

  describe('missing structural fields', () => {
    it('EMPTY: {entry without message property} => returns empty array and does not throw', () => {
      const entry = EntryWithoutMessage();

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {entry with message but no content} => returns empty array and does not throw', () => {
      const entry = EntryWithMessageNoContent();

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {entry with null message} => returns empty array and does not throw', () => {
      const entry = EntryWithNullMessage();

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {content item is null} => returns empty array and does not throw', () => {
      const entry = EntryWithNullContentItem();

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {Task tool_use item without id} => returns empty and does NOT stamp agentId', () => {
      const entry = TaskToolUseWithoutId();

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
      expect(getContentItemAgentId({ entry, index: 0 })).toBe(undefined);
    });

    it('EMPTY: {Task tool_use item with numeric id} => returns empty and does NOT stamp agentId', () => {
      const entry = TaskToolUseWithNumericId();

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
      expect(getContentItemAgentId({ entry, index: 0 })).toBe(undefined);
    });
  });

  describe('non-tool_use variant items — all skipped', () => {
    it('EMPTY: {content array with thinking item} => returns empty array, does not stamp', () => {
      const entry = AssistantThinkingEntry();

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {content array with redacted_thinking item} => returns empty array, does not stamp', () => {
      const entry = AssistantRedactedThinkingEntry();

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {content array with tool_result item} => returns empty array — only Task/Agent tool_use extracted', () => {
      const toolUseId = ToolUseIdStub({ value: 'toolu_tr_01' });
      const entry = AssistantToolResultEntry({ toolUseId });

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });
  });

  describe('multiple items', () => {
    it('VALID: {multiple Task tool_use items} => returns all ids and stamps each item with its own id', () => {
      const toolUseId1 = ToolUseIdStub({ value: 'toolu_task_a' });
      const toolUseId2 = ToolUseIdStub({ value: 'toolu_task_b' });
      const entry = AssistantMultipleTaskEntry({ toolUseId1, toolUseId2 });

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual(['toolu_task_a', 'toolu_task_b']);
      expect(getContentItemAgentId({ entry, index: 0 })).toBe('toolu_task_a');
      expect(getContentItemAgentId({ entry, index: 1 })).toBe('toolu_task_b');
    });

    it('VALID: {mixed Task and Agent tool_use items} => returns all ids and stamps each independently', () => {
      const toolUseId1 = ToolUseIdStub({ value: 'toolu_task_c' });
      const toolUseId2 = ToolUseIdStub({ value: 'toolu_agent_d' });
      const entry = AssistantMixedAgentTaskEntry({ toolUseId1, toolUseId2 });

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual(['toolu_task_c', 'toolu_agent_d']);
      expect(getContentItemAgentId({ entry, index: 0 })).toBe('toolu_task_c');
      expect(getContentItemAgentId({ entry, index: 1 })).toBe('toolu_agent_d');
    });
  });
});
