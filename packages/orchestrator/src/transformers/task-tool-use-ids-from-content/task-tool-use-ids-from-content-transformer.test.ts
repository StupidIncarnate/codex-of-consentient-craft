import {
  AssistantToolUseStreamLineStub,
  AssistantTextStreamLineStub,
} from '@dungeonmaster/shared/contracts';

import { ToolUseIdStub } from '../../contracts/tool-use-id/tool-use-id.stub';
import { taskToolUseIdsFromContentTransformer } from './task-tool-use-ids-from-content-transformer';

const AssistantTaskEntry = ({ toolUseId }: { toolUseId: string }) => ({
  ...AssistantToolUseStreamLineStub({
    message: {
      role: 'assistant',
      content: [{ type: 'tool_use', id: toolUseId, name: 'Task', input: {} }],
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

describe('taskToolUseIdsFromContentTransformer', () => {
  describe('valid extraction', () => {
    it('VALID: {assistant entry with Task tool_use} => returns tool_use id', () => {
      const toolUseId = ToolUseIdStub({ value: 'toolu_task_01' });
      const entry = AssistantTaskEntry({ toolUseId });

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual(['toolu_task_01']);
    });
  });

  describe('empty results', () => {
    it('EMPTY: {assistant entry with non-Task tool_use} => returns empty array', () => {
      const toolUseId = ToolUseIdStub({ value: 'toolu_bash_01' });
      const entry = AssistantNonTaskToolEntry({ toolUseId });

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {assistant text entry without tool_use items} => returns empty array', () => {
      const entry = AssistantTextStreamLineStub();

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {entry without message property} => returns empty array', () => {
      const entry = EntryWithoutMessage();

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {entry with message but no content} => returns empty array', () => {
      const entry = EntryWithMessageNoContent();

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {entry with null message} => returns empty array', () => {
      const entry = EntryWithNullMessage();

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {content item is null} => returns empty array', () => {
      const entry = EntryWithNullContentItem();

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {Task tool_use item without id} => returns empty array', () => {
      const entry = TaskToolUseWithoutId();

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {Task tool_use item with numeric id} => returns empty array', () => {
      const entry = TaskToolUseWithNumericId();

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });
  });

  describe('multiple items', () => {
    it('VALID: {multiple Task tool_use items} => returns all ids', () => {
      const toolUseId1 = ToolUseIdStub({ value: 'toolu_task_a' });
      const toolUseId2 = ToolUseIdStub({ value: 'toolu_task_b' });
      const entry = AssistantMultipleTaskEntry({ toolUseId1, toolUseId2 });

      const result = taskToolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual(['toolu_task_a', 'toolu_task_b']);
    });
  });
});
