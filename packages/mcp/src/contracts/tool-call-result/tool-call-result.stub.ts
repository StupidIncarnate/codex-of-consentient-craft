import { toolCallResultContract } from './tool-call-result-contract';
import type { ToolCallResult } from './tool-call-result-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const ToolCallResultStub = ({
  ...props
}: StubArgument<ToolCallResult> = {}): ToolCallResult =>
  toolCallResultContract.parse({
    content: [
      {
        type: 'text',
        text: 'Sample result content',
      },
    ],
    ...props,
  });
