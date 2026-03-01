import type { StubArgument } from '@dungeonmaster/shared/@types';

import { toolResponseContract } from './tool-response-contract';
import type { ToolResponse } from './tool-response-contract';

export const ToolResponseStub = ({ ...props }: StubArgument<ToolResponse> = {}): ToolResponse =>
  toolResponseContract.parse({
    content: [{ type: 'text', text: 'Stub response' }],
    ...props,
  });
