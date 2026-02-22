import { folderTypeContract } from './folder-type-contract';
import type { FolderType } from './folder-type-contract';

export const FolderTypeStub = ({ value }: { value: string } = { value: 'brokers' }): FolderType =>
  folderTypeContract.parse(value);
