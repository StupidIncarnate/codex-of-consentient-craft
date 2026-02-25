import {
  SuccessfulToolResultStreamLineStub,
  AssistantTextStreamLineStub,
  UserTextStringStreamLineStub,
} from '@dungeonmaster/shared/contracts';

import { ToolUseIdStub } from '../../contracts/tool-use-id/tool-use-id.stub';
import { toolUseIdsFromContentTransformer } from './tool-use-ids-from-content-transformer';

const UserToolResultEntry = ({ toolUseId }: { toolUseId: string }) => ({
  ...SuccessfulToolResultStreamLineStub({
    message: {
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
    },
  } as Parameters<typeof SuccessfulToolResultStreamLineStub>[0]),
});

const EntryWithoutMessage = () => ({
  type: 'user' as const,
});

const EntryWithNullMessage = () => ({
  type: 'user' as const,
  message: null,
});

const EntryWithMessageNoContent = () => ({
  type: 'user' as const,
  message: { role: 'user' as const },
});

const EntryWithNullContentItem = () => ({
  message: { content: [null] },
});

const ToolResultWithoutToolUseId = () => ({
  message: {
    content: [{ type: 'tool_result' as const, content: 'done' }],
  },
});

const ToolResultWithNumericToolUseId = () => ({
  message: {
    content: [{ type: 'tool_result' as const, tool_use_id: 999, content: 'done' }],
  },
});

const UserMultipleToolResultEntry = ({
  toolUseId1,
  toolUseId2,
}: {
  toolUseId1: string;
  toolUseId2: string;
}) => ({
  ...SuccessfulToolResultStreamLineStub({
    message: {
      role: 'user',
      content: [
        { type: 'tool_result', tool_use_id: toolUseId1, content: 'done' },
        { type: 'tool_result', tool_use_id: toolUseId2, content: 'done' },
      ],
    },
  } as Parameters<typeof SuccessfulToolResultStreamLineStub>[0]),
});

describe('toolUseIdsFromContentTransformer', () => {
  describe('valid extraction', () => {
    it('VALID: {entry with tool_result content} => returns tool_use_id array', () => {
      const toolUseId = ToolUseIdStub({ value: 'toolu_01X' });
      const entry = UserToolResultEntry({ toolUseId });

      const result = toolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual(['toolu_01X']);
    });
  });

  describe('empty results', () => {
    it('EMPTY: {assistant text entry without tool_result items} => returns empty array', () => {
      const entry = AssistantTextStreamLineStub();

      const result = toolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {user text entry with non-array content} => returns empty array', () => {
      const entry = UserTextStringStreamLineStub();

      const result = toolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {entry without message property} => returns empty array', () => {
      const entry = EntryWithoutMessage();

      const result = toolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {entry with null message} => returns empty array', () => {
      const entry = EntryWithNullMessage();

      const result = toolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {entry with message but no content} => returns empty array', () => {
      const entry = EntryWithMessageNoContent();

      const result = toolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {content item is null} => returns empty array', () => {
      const entry = EntryWithNullContentItem();

      const result = toolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {tool_result without tool_use_id} => returns empty array', () => {
      const entry = ToolResultWithoutToolUseId();

      const result = toolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {tool_result with numeric tool_use_id} => returns empty array', () => {
      const entry = ToolResultWithNumericToolUseId();

      const result = toolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });
  });

  describe('multiple items', () => {
    it('VALID: {multiple tool_result items} => returns all tool_use_ids', () => {
      const toolUseId1 = ToolUseIdStub({ value: 'toolu_01A' });
      const toolUseId2 = ToolUseIdStub({ value: 'toolu_01B' });
      const entry = UserMultipleToolResultEntry({ toolUseId1, toolUseId2 });

      const result = toolUseIdsFromContentTransformer({ entry });

      expect(result).toStrictEqual(['toolu_01A', 'toolu_01B']);
    });
  });
});
