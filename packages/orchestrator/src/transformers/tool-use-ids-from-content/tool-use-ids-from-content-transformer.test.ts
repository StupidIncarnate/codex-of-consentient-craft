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
  });
});
