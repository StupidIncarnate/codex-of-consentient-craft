import type { HookToolResponse } from './tool-response-contract';
import { hookToolResponseContract } from './tool-response-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const HookToolResponseStub = ({ ...props }: StubArgument<HookToolResponse> = {}): HookToolResponse =>
  hookToolResponseContract.parse({
    filePath: '/test/file.ts',
    success: true,
    ...props,
  });
