import type { ToolInput } from './tool-input-contract';
import { toolInputContract } from './tool-input-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const ToolInputStub = ({ ...props }: StubArgument<ToolInput> = {}): ToolInput =>
  toolInputContract.parse({
    file_path: '/test/file.ts',
    content: '',
    ...props,
  });
