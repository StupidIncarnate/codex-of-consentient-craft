import { isKeyOfGuard } from '@questmaestro/shared/guards';

import { folderConfigStatics } from '../../statics/folder-config/folder-config-statics';

type FolderConfig = (typeof folderConfigStatics)[keyof typeof folderConfigStatics];

export const folderConfigTransformer = ({
  folderType,
}: {
  folderType: string;
}): FolderConfig | undefined => {
  if (!isKeyOfGuard(folderType, folderConfigStatics)) {
    return undefined;
  }

  return folderConfigStatics[folderType];
};
