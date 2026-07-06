/**
 * PURPOSE: Classifies a named export (e.g. userFetchBroker, filePathContract) into the folder type
 * that produces it, by matching the export-name suffix declared in folderConfigStatics. Used to
 * gate main-barrel cross-package imports (import { x } from '@scope/pkg') by folder type. No folder
 * export-suffix is a suffix of another, so the first match is unambiguous.
 *
 * USAGE:
 * importFolderTypeFromNameTransformer({ importName: 'filePathContract' });
 * // Returns 'contracts'
 * importFolderTypeFromNameTransformer({ importName: 'BaseNameStub' });
 * // Returns null (no folder export-suffix matches)
 */
import { folderConfigStatics } from '@dungeonmaster/shared/statics';
import { folderTypeContract, type FolderType } from '@dungeonmaster/shared/contracts';
import { isKeyOfGuard } from '@dungeonmaster/shared/guards';

export const importFolderTypeFromNameTransformer = ({
  importName,
}: {
  importName: string;
}): FolderType | null => {
  for (const key in folderConfigStatics) {
    if (!isKeyOfGuard(key, folderConfigStatics)) {
      continue;
    }

    const { exportSuffix } = folderConfigStatics[key];

    if (exportSuffix.length === 0 || !importName.endsWith(exportSuffix)) {
      continue;
    }

    const parsed = folderTypeContract.safeParse(key);

    if (parsed.success) {
      return parsed.data;
    }
  }

  return null;
};
