/**
 * PURPOSE: Extracts the folder type from a file path by matching the src/[folderType]/ segment against folderConfigStatics
 *
 * USAGE:
 * pathToFolderTypeTransformer({filePath: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts', folderConfigs: folderConfigStatics});
 * // Returns 'guards' as FolderType, or undefined if no match
 */
import type { FolderType, StepFileReferenceStub } from '@dungeonmaster/shared/contracts';
import type { folderConfigStatics } from '@dungeonmaster/shared/statics';

type StepFileReference = ReturnType<typeof StepFileReferenceStub>;

export const pathToFolderTypeTransformer = ({
  filePath,
  folderConfigs,
}: {
  filePath?: StepFileReference['path'];
  folderConfigs?: typeof folderConfigStatics;
}): FolderType | undefined => {
  if (!filePath || !folderConfigs) {
    return undefined;
  }

  const [, candidate] = /src\/([^/]+)\//u.exec(String(filePath)) ?? [];
  if (!candidate) {
    return undefined;
  }
  if (candidate in folderConfigs) {
    return candidate as FolderType;
  }
  return undefined;
};
