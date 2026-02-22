import { folderDetailInputContract } from './folder-detail-input-contract';
import type { FolderDetailInput } from './folder-detail-input-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const FolderDetailInputStub = ({
  ...props
}: StubArgument<FolderDetailInput> = {}): FolderDetailInput =>
  folderDetailInputContract.parse({
    folderType: 'brokers',
    ...props,
  });
