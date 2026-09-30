import type { StubArgument } from '../../@types/stub-argument.type';

import { toolUseContract } from './tool-use-contract';
import type { ToolUse } from './tool-use-contract';

/**
 * Assistant tool invocation block — emitted when the assistant calls a tool, containing
 * the tool ID, name, and structured input parameters.
 */
export const ToolUseStub = ({ ...props }: StubArgument<ToolUse> = {}): ToolUse =>
  toolUseContract.parse({
    type: 'tool_use',
    id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
    name: 'Bash',
    input: { command: 'ls -la' },
    ...props,
  });
