import type { ToolResponse } from './tool-response-contract';
import { toolResponseContract } from './tool-response-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const ToolResponseStub = ({ ...props }: StubArgument<ToolResponse> = {}): ToolResponse =>
  toolResponseContract.parse({
    filePath: '/test/file.ts',
    success: true,
    ...props,
  });
