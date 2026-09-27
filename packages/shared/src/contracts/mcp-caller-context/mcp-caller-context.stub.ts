import type { StubArgument } from '../../@types/stub-argument.type';

import { mcpCallerContextContract } from './mcp-caller-context-contract';
import type { McpCallerContext } from './mcp-caller-context-contract';

export const McpCallerContextStub = ({
  ...props
}: StubArgument<McpCallerContext> = {}): McpCallerContext =>
  mcpCallerContextContract.parse({
    cwd: '/home/user/repo',
    sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
    ...props,
  });
