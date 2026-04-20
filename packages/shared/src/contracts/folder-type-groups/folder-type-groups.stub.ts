import { folderTypeGroupsContract } from './folder-type-groups-contract';
import type { FolderTypeGroups } from './folder-type-groups-contract';

export const FolderTypeGroupsStub = (
  { value }: { value: string[][] } = {
    value: [['contracts', 'statics']],
  },
): FolderTypeGroups => folderTypeGroupsContract.parse(value);
