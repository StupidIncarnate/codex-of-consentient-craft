import type { StubArgument } from '@dungeonmaster/shared/@types';

import { mcpQuestWorkInputContract } from './mcp-quest-work-input-contract';
import type { McpQuestWorkInput } from './mcp-quest-work-input-contract';

export const McpQuestWorkInputStub = ({
  ...props
}: StubArgument<McpQuestWorkInput> = {}): McpQuestWorkInput =>
  mcpQuestWorkInputContract.parse({
    questId: 'add-auth',
    workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    payload: {
      kind: 'outcome',
      word: 'done',
      reason: 'every assigned unit is met',
    },
    ...props,
  });
