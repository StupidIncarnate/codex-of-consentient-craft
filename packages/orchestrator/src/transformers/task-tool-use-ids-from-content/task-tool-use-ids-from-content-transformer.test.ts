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
  });
});
