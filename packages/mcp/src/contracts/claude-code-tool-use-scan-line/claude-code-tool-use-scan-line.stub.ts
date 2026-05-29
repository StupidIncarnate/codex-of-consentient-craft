import type { StubArgument } from '@dungeonmaster/shared/@types';

import {
  claudeCodeToolUseScanLineContract,
  type ClaudeCodeToolUseScanLine,
} from './claude-code-tool-use-scan-line-contract';

export const ClaudeCodeToolUseScanLineStub = ({
  ...props
}: StubArgument<ClaudeCodeToolUseScanLine> = {}): ClaudeCodeToolUseScanLine =>
  claudeCodeToolUseScanLineContract.parse({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'toolu_011pw36EFwmLorR7MdaSDEQG',
          name: 'mcp__dungeonmaster__get-agent-prompt',
          input: {},
        },
      ],
    },
    ...props,
  });
