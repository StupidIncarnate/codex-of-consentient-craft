import type { FolderType } from '../../contracts/folder-type/folder-type-contract';
import { folderConfigStatics } from '../../statics/folder-config/folder-config-statics';

type FolderConfig = (typeof folderConfigStatics)[keyof typeof folderConfigStatics];

export const folderConfigTransformer = ({
  folderType,
}: {
  folderType: FolderType;
}): FolderConfig => {
  const key = folderType as string as keyof typeof folderConfigStatics;
  return folderConfigStatics[key];
};
