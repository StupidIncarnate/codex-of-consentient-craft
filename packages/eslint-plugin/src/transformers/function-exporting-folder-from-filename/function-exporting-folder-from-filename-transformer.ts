/**
 * PURPOSE: Determines which function-exporting folder type a filename belongs to, or undefined if outside all function-exporting folders
 *
 * USAGE:
 * const folderType = functionExportingFolderFromFilenameTransformer({ filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts' });
 * // Returns branded FolderType 'brokers'
 */
import type { FolderType } from '@dungeonmaster/shared/contracts';
import { folderTypeContract } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';
import { isFileInFolderTypeGuard } from '../../guards/is-file-in-folder-type/is-file-in-folder-type-guard';
import { functionExportingFoldersStatics } from '../../statics/function-exporting-folders/function-exporting-folders-statics';

export const functionExportingFolderFromFilenameTransformer = ({
  filename,
}: {
  filename?: string;
}): FolderType | undefined => {
  if (!filename) {
    return undefined;
  }
  for (const folderType of functionExportingFoldersStatics.names) {
    const suffix = folderConfigStatics[folderType].exportSuffix.toLowerCase();
    if (isFileInFolderTypeGuard({ filename, folderType, suffix })) {
      return folderTypeContract.parse(folderType);
    }
  }
  if (filename.includes(functionExportingFoldersStatics.startupPathSegment)) {
    return folderTypeContract.parse(functionExportingFoldersStatics.startupFolderType);
  }
  return undefined;
};
