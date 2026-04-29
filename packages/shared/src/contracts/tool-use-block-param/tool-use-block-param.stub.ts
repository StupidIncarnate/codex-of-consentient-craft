import type { StubArgument } from '@dungeonmaster/shared/@types';

import { toolUseBlockParamContract } from './tool-use-block-param-contract';
import type { ToolUseBlockParam } from './tool-use-block-param-contract';

/**
 * Assistant tool invocation block — emitted when the assistant calls a tool, containing
 * the tool ID, name, and structured input parameters.
 */
export const ToolUseBlockParamStub = ({
  ...props
}: StubArgument<ToolUseBlockParam> = {}): ToolUseBlockParam =>
  toolUseBlockParamContract.parse({
    type: 'tool_use',
    id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
    name: 'Bash',
    input: { command: 'ls -la' },
    ...props,
  });
