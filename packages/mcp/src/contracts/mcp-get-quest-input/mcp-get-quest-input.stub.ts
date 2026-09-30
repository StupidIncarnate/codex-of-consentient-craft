import type { StubArgument } from '@dungeonmaster/shared/@types';

import { mcpGetQuestInputContract } from './mcp-get-quest-input-contract';
import type { McpGetQuestInput } from './mcp-get-quest-input-contract';

export const McpGetQuestInputStub = ({
  ...props
}: StubArgument<McpGetQuestInput> = {}): McpGetQuestInput => {
  const { stage, flowId, packageName, ...dataProps } = props;

  return mcpGetQuestInputContract.parse({
    questId: 'test-quest',
    ...dataProps,
    ...(stage !== undefined && { stage }),
    ...(flowId !== undefined && { flowId }),
    ...(packageName !== undefined && { packageName }),
  });
};
