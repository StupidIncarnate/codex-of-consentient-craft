import { toolCallContentContract } from './tool-call-content-contract';
import type { ToolCallContent } from './tool-call-content-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const ToolCallContentStub = ({
  ...props
}: StubArgument<ToolCallContent> = {}): ToolCallContent =>
  toolCallContentContract.parse({
    type: 'text',
    text: 'Sample content',
    ...props,
  });
