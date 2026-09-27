import type { StubArgument } from '@dungeonmaster/shared/@types';

import { toolCallParamsContract } from './tool-call-params-contract';
import type { ToolCallParams } from './tool-call-params-contract';

export const ToolCallParamsStub = ({
  ...props
}: StubArgument<ToolCallParams> = {}): ToolCallParams =>
  toolCallParamsContract.parse({
    args: { glob: 'packages/*/src/**' },
    ...props,
  });
