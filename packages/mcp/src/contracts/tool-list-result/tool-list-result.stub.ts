import { toolListResultContract } from './tool-list-result-contract';
import type { ToolListResult } from './tool-list-result-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const ToolListResultStub = ({
  ...props
}: StubArgument<ToolListResult> = {}): ToolListResult =>
  toolListResultContract.parse({
    tools: [
      {
        name: 'discover',
        description: 'Discover utilities, brokers, standards across the codebase',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    ],
    ...props,
  });
