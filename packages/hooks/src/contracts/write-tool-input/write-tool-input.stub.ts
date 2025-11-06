import type { WriteToolInput } from './write-tool-input-contract';
import { writeToolInputContract } from './write-tool-input-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const WriteToolInputStub = ({
  ...props
}: StubArgument<WriteToolInput> = {}): WriteToolInput =>
  writeToolInputContract.parse({
    file_path: '/test/file.ts',
    content: '',
    ...props,
  });
