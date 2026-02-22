import { toolContract } from './tool-contract';
import type { Tool } from './tool-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const ToolStub = ({ ...props }: StubArgument<Tool> = {}): Tool =>
  toolContract.parse({
    name: 'discover',
    description: 'Discover utilities, brokers, standards across the codebase',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    ...props,
  });
