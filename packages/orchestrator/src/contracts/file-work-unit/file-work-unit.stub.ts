import type { StubArgument } from '@dungeonmaster/shared/@types';

import { fileWorkUnitContract } from './file-work-unit-contract';
import type { FileWorkUnit } from './file-work-unit-contract';

export const FileWorkUnitStub = ({ ...props }: StubArgument<FileWorkUnit> = {}): FileWorkUnit =>
  fileWorkUnitContract.parse({
    filePath: '/home/user/project/src/example.ts',
    errors: ['Missing return type on exported function'],
    ...props,
  });
