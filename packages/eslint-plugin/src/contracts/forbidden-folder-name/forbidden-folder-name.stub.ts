import { forbiddenFolderNameContract } from './forbidden-folder-name-contract';
import type { ForbiddenFolderName } from './forbidden-folder-name-contract';

export const ForbiddenFolderNameStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'utils',
  },
): ForbiddenFolderName => forbiddenFolderNameContract.parse(value);
