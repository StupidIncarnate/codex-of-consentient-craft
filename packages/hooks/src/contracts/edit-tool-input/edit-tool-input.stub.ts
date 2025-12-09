import type { EditToolInput } from './edit-tool-input-contract';
import { editToolInputContract } from './edit-tool-input-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const EditToolInputStub = ({ ...props }: StubArgument<EditToolInput> = {}): EditToolInput =>
  editToolInputContract.parse({
    file_path: '/test/file.ts',
    old_string: 'old value',
    new_string: 'new value',
    replace_all: false,
    ...props,
  });
