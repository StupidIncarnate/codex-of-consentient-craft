import type { MultiEditToolInput } from './multi-edit-tool-input-contract';
import { multiEditToolInputContract } from './multi-edit-tool-input-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const MultiEditToolInputStub = ({
  ...props
}: StubArgument<MultiEditToolInput> = {}): MultiEditToolInput =>
  multiEditToolInputContract.parse({
    file_path: '/test/file.ts',
    edits: [
      {
        old_string: 'old value 1',
        new_string: 'new value 1',
        replace_all: false,
      },
    ],
    ...props,
  });
