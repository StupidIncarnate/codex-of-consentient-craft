import type { StubArgument } from '@dungeonmaster/shared/@types';

import { mcpGetQuestInputContract } from './get-quest-input-contract';
import type { GetQuestInput } from './get-quest-input-contract';

export const McpGetQuestInputStub = ({
  ...props
}: StubArgument<GetQuestInput> = {}): GetQuestInput => {
  const { stage, flowId, packageName, ...dataProps } = props;

  return mcpGetQuestInputContract.parse({
    questId: 'test-quest',
    ...dataProps,
    ...(stage !== undefined && { stage }),
    ...(flowId !== undefined && { flowId }),
    ...(packageName !== undefined && { packageName }),
  });
};
